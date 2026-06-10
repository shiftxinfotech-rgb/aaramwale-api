import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { WalkInSession } from './walk-in-session.entity';
import { CreateWalkInSessionDto } from './dto/create-walk-in-session.dto';
import { Customer } from '../customers/customer.entity';
import { Asset } from '../assets/asset.entity';
import { Outlet } from '../outlets/outlet.entity';
import { User } from '../users/user.entity';

@Injectable()
export class WalkInSessionsService {
  constructor(
    @InjectRepository(WalkInSession)
    private walkInSessionRepository: Repository<WalkInSession>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Outlet)
    private outletRepository: Repository<Outlet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(
    createDto: CreateWalkInSessionDto,
    employeeId: number,
    employeeOutletId?: number,
  ): Promise<WalkInSession> {
    const { customerId, outletId, assetId, quantity, discountType, discountValue, remarks, sessionDate } = createDto;

    // 1. Verify Customer exists
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // 2. Verify Outlet exists
    const outlet = await this.outletRepository.findOne({ where: { id: outletId } });
    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${outletId} not found`);
    }

    if (employeeOutletId && outletId !== employeeOutletId) {
      throw new BadRequestException('Cannot create session for another outlet');
    }

    // 3. Verify Asset exists
    const asset = await this.assetRepository.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }
    if (!asset.isActive) {
      throw new BadRequestException('Asset is not active');
    }
    if (asset.outletId !== outletId) {
      throw new BadRequestException('Asset does not belong to the specified outlet');
    }

    // 4. Calculate pricing
    const unitPrice = Number(asset.unitPrice);
    const subtotal = quantity * unitPrice;

    const discType = discountType ?? 'NONE';
    const discVal = discountValue ?? 0;
    let discountAmount = 0;

    if (discType === 'PERCENTAGE') {
      discountAmount = subtotal * (discVal / 100);
    } else if (discType === 'FIXED') {
      discountAmount = discVal;
    }

    const finalAmount = subtotal - discountAmount;
    if (finalAmount < 0) {
      throw new BadRequestException('Discount value results in a negative final amount');
    }

    const sDate = sessionDate ?? new Date().toISOString().split('T')[0];

    // 5. Database transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}${mm}${dd}`;

      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const todayCount = await queryRunner.manager.count(WalkInSession, {
        where: {
          createdAt: Between(startOfDay, endOfDay),
        },
      });

      const nextSeq = todayCount + 1;
      const seqStr = String(nextSeq).padStart(4, '0');
      const sessionNumber = `WI${dateStr}${seqStr}`;

      const session = queryRunner.manager.create(WalkInSession, {
        sessionNumber,
        customerId,
        outletId,
        assetId,
        categoryId: asset.categoryId,
        quantity,
        unitPrice,
        subtotalAmount: subtotal,
        discountType: discType,
        discountValue: discVal,
        discountAmount,
        finalAmount,
        remarks: remarks ?? 'Walk-in session',
        employeeId,
        sessionDate: sDate,
      });

      const savedSession = await queryRunner.manager.save(session);
      await queryRunner.commitTransaction();

      return this.findOne(savedSession.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    outletId?: number;
    customerId?: number;
    assetId?: number;
    employeeId?: number;
    sessionDate?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<any> {
    const page = query.page ? +query.page : 1;
    const limit = query.limit ? +query.limit : 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.walkInSessionRepository.createQueryBuilder('session')
      .leftJoinAndSelect('session.customer', 'customer')
      .leftJoinAndSelect('session.outlet', 'outlet')
      .leftJoinAndSelect('session.asset', 'asset')
      .leftJoinAndSelect('session.category', 'category')
      .leftJoinAndSelect('session.employee', 'employee');

    if (query.outletId) {
      queryBuilder.andWhere('session.outletId = :outletId', { outletId: query.outletId });
    }
    if (query.customerId) {
      queryBuilder.andWhere('session.customerId = :customerId', { customerId: query.customerId });
    }
    if (query.assetId) {
      queryBuilder.andWhere('session.assetId = :assetId', { assetId: query.assetId });
    }
    if (query.employeeId) {
      queryBuilder.andWhere('session.employeeId = :employeeId', { employeeId: query.employeeId });
    }
    if (query.sessionDate) {
      queryBuilder.andWhere('session.sessionDate = :sessionDate', { sessionDate: query.sessionDate });
    }
    if (query.fromDate) {
      queryBuilder.andWhere('session.sessionDate >= :fromDate', { fromDate: query.fromDate });
    }
    if (query.toDate) {
      queryBuilder.andWhere('session.sessionDate <= :toDate', { toDate: query.toDate });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(session.sessionNumber ILIKE :search OR customer.name ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    const allowedSortFields = ['id', 'sessionNumber', 'subtotalAmount', 'discountAmount', 'finalAmount', 'sessionDate', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    queryBuilder.orderBy(`session.${sortField}`, sortOrder);

    const totalRecords = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);

    const data = await queryBuilder.getMany();
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data,
      meta: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number): Promise<WalkInSession> {
    const session = await this.walkInSessionRepository.findOne({
      where: { id },
      relations: ['customer', 'outlet', 'asset', 'category', 'employee'],
    });

    if (!session) {
      throw new NotFoundException(`Walk-in session with ID ${id} not found`);
    }

    return session;
  }
}
