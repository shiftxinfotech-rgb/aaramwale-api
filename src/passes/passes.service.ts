import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Pass, PassStatus, PassDiscountType } from './pass.entity';
import { PassItem } from './pass-item.entity';
import { Asset } from '../assets/asset.entity';
import { Customer } from '../customers/customer.entity';
import { Token } from './token.entity';
import { WalkInSession } from '../walk-in-sessions/walk-in-session.entity';
import { CreatePassDto } from './dto/create-pass.dto';
import { UpdatePassDto } from './dto/update-pass.dto';
import { PassResponseDto } from './dto/pass-response.dto';
import { PassDateGroupDto } from './dto/pass-date-group.dto';
import { PassStatsResponseDto } from './dto/pass-stats-response.dto';
import { RedeemPassDto } from './dto/redeem-pass.dto';

@Injectable()
export class PassesService {
  constructor(
    @InjectRepository(Pass)
    private passRepository: Repository<Pass>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    private dataSource: DataSource,
  ) {}

  async create(
    createPassDto: CreatePassDto, 
    employeeId: number, 
    employeeRole: string,
    employeeOutletId?: number
  ): Promise<PassResponseDto> {
    const { customerId, discountType, discountValue, items } = createPassDto;

    // 1. Verify Customer exists
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('Pass must contain at least one item');
    }

    // 2. Load all requested assets
    const assetIds = items.map((i) => i.assetId);
    const assets = await this.assetRepository.find({
      where: assetIds.map(id => ({ id })),
      relations: ['outlet', 'category'],
    });

    const assetMap = new Map<number, Asset>();
    for (const asset of assets) {
      assetMap.set(asset.id, asset);
    }

    // Validate that all requested assets exist, are active, and belong to the same outlet
    let determinedOutletId: number | null = null;

    for (const item of items) {
      const asset = assetMap.get(item.assetId);
      if (!asset) {
        throw new NotFoundException(`Asset with ID ${item.assetId} not found`);
      }
      if (!asset.isActive) {
        throw new BadRequestException(`Asset "${asset.assetName}" is not active`);
      }

      // Check item quantities
      const paidQty = item.paidQuantity;
      const freeQty = item.freeQuantity ?? 0;
      if (paidQty < 0 || freeQty < 0) {
        throw new BadRequestException('Quantities cannot be negative');
      }
      if (paidQty + freeQty < 1) {
        throw new BadRequestException('Total quantity (paid + free) must be at least 1');
      }

      if (determinedOutletId === null) {
        determinedOutletId = asset.outletId;
      } else if (determinedOutletId !== asset.outletId) {
        throw new BadRequestException('All assets in a single pass must belong to the same outlet');
      }
    }

    const outletId = determinedOutletId as number;

    // Check outlet authorization if called by employee
    if (employeeOutletId && outletId !== employeeOutletId) {
      throw new BadRequestException('Assets do not belong to your outlet');
    }

    // 3. Compute Totals
    let subtotal = 0;
    const computedItems = items.map((item) => {
      const asset = assetMap.get(item.assetId)!;
      const paidQuantity = item.paidQuantity;
      const freeQuantity = item.freeQuantity ?? 0;
      const totalQuantity = paidQuantity + freeQuantity;
      const unitPrice = Number(asset.unitPrice);
      const lineTotal = paidQuantity * unitPrice;

      subtotal += lineTotal;

      return {
        categoryId: asset.categoryId,
        assetId: item.assetId,
        paidQuantity,
        freeQuantity,
        totalQuantity,
        unitPrice,
        lineTotal,
      };
    });

    const discType = discountType ?? PassDiscountType.NONE;
    const discVal = discountValue ?? 0;
    let discountAmount = 0;

    if (discType === PassDiscountType.PERCENTAGE) {
      discountAmount = subtotal * (discVal / 100);
    } else if (discType === PassDiscountType.FIXED) {
      discountAmount = discVal;
    }

    const finalAmount = subtotal - discountAmount;
    if (finalAmount < 0) {
      throw new BadRequestException('Discount value results in a negative final amount');
    }

    // 4. Database Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate Pass Number
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}${mm}${dd}`;

      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const todayPassesCount = await queryRunner.manager.count(Pass, {
        where: {
          createdAt: Between(startOfDay, endOfDay),
        },
      });

      const nextSeq = todayPassesCount + 1;
      const seqStr = String(nextSeq).padStart(4, '0');
      const passNumber = `AW${dateStr}${seqStr}`;

      const pass = queryRunner.manager.create(Pass, {
        passNumber,
        customerId,
        outletId,
        subtotalAmount: subtotal,
        discountType: discType as PassDiscountType,
        discountValue: discVal,
        discountAmount,
        finalAmount,
        generatedByUserId: employeeId,
        generatedByRole: employeeRole,
        status: PassStatus.ACTIVE,
      });

      const savedPass = await queryRunner.manager.save(pass);

      const passItems = computedItems.map((item) => {
        return queryRunner.manager.create(PassItem, {
          passId: savedPass.id,
          categoryId: item.categoryId,
          assetId: item.assetId,
          paidQuantity: item.paidQuantity,
          freeQuantity: item.freeQuantity,
          totalQuantity: item.totalQuantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        });
      });

      await queryRunner.manager.save(PassItem, passItems);
      await queryRunner.commitTransaction();

      return this.findOneMapped(savedPass.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async search(q: string, outletId?: number): Promise<PassResponseDto[]> {
    if (!q || q.trim().length === 0) {
      return [];
    }

    const query = this.passRepository.createQueryBuilder('pass')
      .leftJoinAndSelect('pass.customer', 'customer')
      .leftJoinAndSelect('pass.items', 'item')
      .leftJoinAndSelect('item.asset', 'asset')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('pass.outlet', 'outlet')
      .leftJoinAndSelect('pass.generatedByUser', 'employee')
      .where(
        '(pass.passNumber ILIKE :q OR customer.name ILIKE :q OR customer.phone ILIKE :q)',
        { q: `%${q.trim()}%` }
      )
      .orderBy('pass.createdAt', 'DESC')
      .take(20);

    if (outletId) {
      query.andWhere('pass.outletId = :outletId', { outletId });
    }

    const passes = await query.getMany();
    const passIds = passes.map((p) => p.id);
    const redemptionMap = await this.getRedemptionMapForPasses(passIds);

    return passes.map((p) => this.toResponseDto(p, redemptionMap));
  }

  async findAll(filters: {
    outletId?: number;
    status?: string;
    assetId?: number;
    categoryId?: number;
    customerId?: number;
    employeeId?: number;
    customerMobile?: string;
    customerName?: string;
    fromDate?: string | Date;
    toDate?: string | Date;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    paginated?: boolean;
  }): Promise<any> {
    const page = filters.page ? +filters.page : 1;
    const limit = filters.limit ? +filters.limit : 10;
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const query = this.passRepository.createQueryBuilder('pass')
      .leftJoinAndSelect('pass.customer', 'customer')
      .leftJoinAndSelect('pass.items', 'item')
      .leftJoinAndSelect('item.asset', 'asset')
      .leftJoinAndSelect('asset.category', 'category')
      .leftJoinAndSelect('pass.outlet', 'outlet')
      .leftJoinAndSelect('pass.generatedByUser', 'employee');

    if (filters.outletId) {
      query.andWhere('pass.outletId = :outletId', { outletId: filters.outletId });
    }
    if (filters.status) {
      query.andWhere('pass.status = :status', { status: filters.status });
    }
    if (filters.customerId) {
      query.andWhere('pass.customerId = :customerId', { customerId: filters.customerId });
    }
    if (filters.employeeId) {
      query.andWhere('pass.generatedByUserId = :employeeId', { employeeId: filters.employeeId });
    }
    if (filters.assetId) {
      query.andWhere('EXISTS (SELECT 1 FROM pass_items pi WHERE pi.passId = pass.id AND pi.assetId = :assetId)', { assetId: filters.assetId });
    }
    if (filters.categoryId) {
      query.andWhere('EXISTS (SELECT 1 FROM pass_items pi WHERE pi.passId = pass.id AND pi.categoryId = :categoryId)', { categoryId: filters.categoryId });
    }
    if (filters.customerMobile) {
      query.andWhere('customer.phone = :customerMobile', { customerMobile: filters.customerMobile });
    }
    if (filters.customerName) {
      query.andWhere('customer.name ILIKE :customerName', { customerName: `%${filters.customerName}%` });
    }
    if (filters.fromDate) {
      const fromDateVal = filters.fromDate instanceof Date ? filters.fromDate : new Date(`${filters.fromDate}T00:00:00.000Z`);
      query.andWhere('pass.createdAt >= :fromDate', { fromDate: fromDateVal });
    }
    if (filters.toDate) {
      const toDateVal = filters.toDate instanceof Date ? filters.toDate : new Date(`${filters.toDate}T23:59:59.999Z`);
      query.andWhere('pass.createdAt <= :toDate', { toDate: toDateVal });
    }

    if (filters.search) {
      query.andWhere(
        '(pass.passNumber ILIKE :search OR customer.name ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const allowedSortFields = ['id', 'passNumber', 'subtotalAmount', 'discountAmount', 'finalAmount', 'status', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    query.orderBy(`pass.${sortField}`, sortOrder);

    const passes = await query.getMany();
    const passIds = passes.map((p) => p.id);
    const redemptionMap = await this.getRedemptionMapForPasses(passIds);

    const formattedPasses = passes.map((p) => this.toResponseDto(p, redemptionMap));

    if (filters.paginated) {
      const totalRecords = await query.getCount();
      const totalPages = Math.ceil(totalRecords / limit);

      // Paginate memory array since getCount runs separately
      const startIndex = (page - 1) * limit;
      const paginatedData = formattedPasses.slice(startIndex, startIndex + limit);

      return {
        data: paginatedData,
        meta: {
          page,
          limit,
          totalRecords,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } else {
      return formattedPasses;
    }
  }

  async findOne(id: number, outletId?: number): Promise<Pass> {
    const pass = await this.passRepository.findOne({
      where: outletId ? { id, outletId } : { id },
      relations: ['customer', 'items', 'items.asset', 'items.category', 'outlet', 'generatedByUser'],
    });

    if (!pass) {
      throw new NotFoundException(`Pass with ID ${id} not found`);
    }

    return pass;
  }

  async findOneMapped(id: number, outletId?: number): Promise<PassResponseDto> {
    const pass = await this.findOne(id, outletId);
    const redemptionMap = await this.getRedemptionMapForPasses([pass.id]);
    return this.toResponseDto(pass, redemptionMap);
  }

  async findByCustomer(customerId: number, outletId?: number): Promise<PassResponseDto[]> {
    return this.findAll({ customerId, outletId });
  }

  async findByOutlet(outletId: number): Promise<PassResponseDto[]> {
    return this.findAll({ outletId });
  }

  async findByDateRange(startDate: Date, endDate: Date, outletId?: number): Promise<PassResponseDto[]> {
    return this.findAll({
      outletId,
      fromDate: startDate,
      toDate: endDate,
    });
  }

  async update(id: number, updatePassDto: UpdatePassDto): Promise<PassResponseDto> {
    const pass = await this.findOne(id);
    if (updatePassDto.status) {
      const newStatus = updatePassDto.status as PassStatus;
      if (newStatus === PassStatus.CANCELLED || newStatus === PassStatus.ACTIVE) {
        pass.status = newStatus;
      } else {
        throw new BadRequestException('Pass status can only be manually changed to ACTIVE or CANCELLED. Redemptions determine other statuses.');
      }
    }
    await this.passRepository.save(pass);
    return this.findOneMapped(id);
  }

  async remove(id: number): Promise<void> {
    const pass = await this.findOne(id);
    await this.passRepository.remove(pass);
  }

  async getTodayStats(outletId?: number): Promise<PassStatsResponseDto> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const passes = await this.findAll({
      outletId,
      fromDate: startOfDay,
      toDate: endOfDay,
    });

    const totalPasses = passes.length;
    const activePasses = passes.filter((p) => p.status === PassStatus.ACTIVE).length;
    const completedPasses = passes.filter((p) => p.status === PassStatus.FULLY_REDEEMED).length;
    const cancelledPasses = passes.filter((p) => p.status === PassStatus.CANCELLED).length;
    
    // Pass Revenue from passes created today
    const passRevenue = passes.reduce((sum, p) => sum + Number(p.finalAmount), 0);

    // Fetch Walk-In Sessions created today
    const walkInRepository = this.dataSource.getRepository(WalkInSession);
    const walkInQuery = walkInRepository.createQueryBuilder('session')
      .where('session.createdAt BETWEEN :start AND :end', { start: startOfDay, end: endOfDay });

    if (outletId) {
      walkInQuery.andWhere('session.outletId = :outletId', { outletId });
    }
    const walkIns = await walkInQuery.getMany();
    const walkInRevenue = walkIns.reduce((sum, w) => sum + Number(w.finalAmount), 0);

    // Fetch Tokens (Redemptions) created today
    const tokenQuery = this.tokenRepository.createQueryBuilder('token')
      .leftJoinAndSelect('token.pass', 'pass')
      .where('token.createdAt BETWEEN :start AND :end', { start: startOfDay, end: endOfDay });

    if (outletId) {
      tokenQuery.andWhere('pass.outletId = :outletId', { outletId });
    }
    const tokens = await tokenQuery.getMany();

    // Redemptions = Pass Redemptions today + Walk-In Sessions today
    const todayRedemptions = tokens.reduce((sum, t) => sum + Number(t.redeemedQuantity), 0) +
                             walkIns.reduce((sum, w) => sum + Number(w.quantity), 0);

    // Free Sessions Used today = Tokens where isFreeConsumption = true
    const freeSessionsUsed = tokens
      .filter((t) => t.isFreeConsumption)
      .reduce((sum, t) => sum + Number(t.redeemedQuantity), 0);

    // Total Revenue is today's pass revenue + today's walk-in revenue
    const totalRevenue = passRevenue + walkInRevenue;

    return {
      totalPasses,
      activePasses,
      completedPasses,
      cancelledPasses,
      totalRevenue,
      passRevenue,
      walkInRevenue,
      todayRedemptions,
      freeSessionsUsed,
      date: startOfDay.toISOString().split('T')[0],
    };
  }

  async findDateWise(filters: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<PassDateGroupDto[]> {
    const passes = await this.findAll(filters);
    const grouped = new Map<string, PassDateGroupDto>();

    for (const pass of passes) {
      const date = new Date(pass.createdAt).toISOString().split('T')[0];
      const existing = grouped.get(date);

      if (existing) {
        existing.passes.push(pass);
        existing.totalPasses += 1;
        existing.totalRevenue += Number(pass.finalAmount);
        continue;
      }

      grouped.set(date, {
        date,
        totalPasses: 1,
        totalRevenue: Number(pass.finalAmount),
        passes: [pass],
      });
    }

    return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  // REDEEM PASS API Logic
  async redeem(
    passId: number,
    redeemPassDto: RedeemPassDto,
    userId: number,
    employeeOutletId?: number
  ): Promise<PassResponseDto> {
    const pass = await this.findOne(passId, employeeOutletId);

    if (pass.status === PassStatus.CANCELLED) {
      throw new BadRequestException('Cannot redeem a cancelled pass');
    }
    if (pass.status === PassStatus.FULLY_REDEEMED) {
      throw new BadRequestException('Pass is already fully redeemed');
    }

    const { items, remarks } = redeemPassDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const redemptionMap = await this.getRedemptionMapForPasses([pass.id]);

      for (const reqItem of items) {
        const passItem = pass.items.find((i) => i.id === reqItem.passItemId);
        if (!passItem) {
          throw new NotFoundException(`Pass item with ID ${reqItem.passItemId} not found on this pass`);
        }

        const redeemedQty = redemptionMap.get(passItem.id) ?? 0;
        const remainingQty = passItem.totalQuantity - redeemedQty;

        if (reqItem.redeemQuantity <= 0) {
          throw new BadRequestException('Redeem quantity must be greater than 0');
        }
        if (reqItem.redeemQuantity > remainingQty) {
          throw new BadRequestException(
            `Cannot redeem ${reqItem.redeemQuantity} sessions for item ID ${passItem.id}. Only ${remainingQty} remaining.`
          );
        }

        // Calculate paid and free split:
        const paidQuantity = passItem.paidQuantity;
        const R_paid = Math.max(0, Math.min(reqItem.redeemQuantity, paidQuantity - redeemedQty));
        const R_free = reqItem.redeemQuantity - R_paid;

        if (R_paid > 0) {
          const paidToken = queryRunner.manager.create(Token, {
            passId: pass.id,
            passItemId: passItem.id,
            assetId: passItem.assetId,
            redeemedQuantity: R_paid,
            isFreeConsumption: false,
            redeemedByUserId: userId,
            remarks: remarks ?? 'Service redeemed (Paid)',
            redeemedAt: new Date(),
          });
          await queryRunner.manager.save(Token, paidToken);
        }

        if (R_free > 0) {
          const freeToken = queryRunner.manager.create(Token, {
            passId: pass.id,
            passItemId: passItem.id,
            assetId: passItem.assetId,
            redeemedQuantity: R_free,
            isFreeConsumption: true,
            redeemedByUserId: userId,
            remarks: remarks ?? 'Service redeemed (Free)',
            redeemedAt: new Date(),
          });
          await queryRunner.manager.save(Token, freeToken);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // Now recalculate status of the pass and update it in DB
    const finalRedemptionMap = await this.getRedemptionMapForPasses([pass.id]);
    let allRedeemed = true;
    let anyRedeemed = false;

    for (const item of pass.items) {
      const redeemed = finalRedemptionMap.get(item.id) ?? 0;
      const remaining = item.totalQuantity - redeemed;
      if (remaining > 0) {
        allRedeemed = false;
      }
      if (redeemed > 0) {
        anyRedeemed = true;
      }
    }

    let nextStatus = PassStatus.ACTIVE;
    if (allRedeemed) {
      nextStatus = PassStatus.FULLY_REDEEMED;
    } else if (anyRedeemed) {
      nextStatus = PassStatus.PARTIALLY_REDEEMED;
    }

    if (pass.status !== nextStatus) {
      pass.status = nextStatus;
      await this.passRepository.save(pass);
    }

    return this.findOneMapped(pass.id);
  }

  // REDEMPTION HISTORY API Logic
  async getRedemptions(passId: number): Promise<any[]> {
    const tokens = await this.tokenRepository.find({
      where: { passId },
      relations: ['asset', 'redeemedByUser'],
      order: { redeemedAt: 'DESC' },
    });

    return tokens.map((t) => ({
      assetName: t.asset?.assetName ?? 'Unknown Asset',
      redeemedQuantity: t.redeemedQuantity,
      isFreeConsumption: t.isFreeConsumption,
      employeeName: t.redeemedByUser?.name ?? 'Unknown Employee',
      redeemedAt: t.redeemedAt ? new Date(t.redeemedAt).toISOString().split('T')[0] : null,
    }));
  }

  private async getRedemptionMapForPasses(passIds: number[]): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    if (!passIds || passIds.length === 0) {
      return map;
    }

    const rawRedemptions = await this.dataSource.getRepository(Token).createQueryBuilder('token')
      .select('token.passItemId', 'passItemId')
      .addSelect('SUM(token.redeemedQuantity)', 'totalRedeemed')
      .where('token.passId IN (:...passIds)', { passIds })
      .groupBy('token.passItemId')
      .getRawMany();

    for (const r of rawRedemptions) {
      map.set(Number(r.passItemId), Number(r.totalRedeemed));
    }
    return map;
  }

  private toResponseDto(pass: Pass, redemptionMap: Map<number, number>): PassResponseDto {
    let allRedeemed = true;
    let anyRedeemed = false;
    const totalItems = pass.items?.length ?? 0;

    const items = pass.items?.map((item) => {
      const redeemedQuantity = redemptionMap.get(item.id) ?? 0;
      const remainingQuantity = Math.max(0, item.totalQuantity - redeemedQuantity);

      if (remainingQuantity > 0) {
        allRedeemed = false;
      }
      if (redeemedQuantity > 0) {
        anyRedeemed = true;
      }

      return {
        passItemId: item.id,
        categoryId: item.categoryId,
        categoryName: item.category?.name ?? 'Unknown Category',
        assetId: item.assetId,
        assetName: item.asset?.assetName ?? 'Unknown Asset',
        paidQuantity: item.paidQuantity,
        freeQuantity: item.freeQuantity,
        totalQuantity: item.totalQuantity,
        redeemedQuantity,
        remainingQuantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        category: {
          id: item.category?.id ?? item.categoryId,
          name: item.category?.name ?? 'Unknown Category',
        },
        asset: {
          id: item.asset?.id ?? item.assetId,
          assetCode: item.asset?.assetCode ?? 'N/A',
          assetName: item.asset?.assetName ?? 'Unknown Asset',
        },
      };
    }) ?? [];

    let computedStatus = pass.status;
    if (pass.status !== PassStatus.CANCELLED) {
      if (totalItems === 0 || !anyRedeemed) {
        computedStatus = PassStatus.ACTIVE;
      } else if (allRedeemed) {
        computedStatus = PassStatus.FULLY_REDEEMED;
      } else {
        computedStatus = PassStatus.PARTIALLY_REDEEMED;
      }
    }

    return {
      id: pass.id,
      passNumber: pass.passNumber,
      customer: {
        id: pass.customer?.id ?? pass.customerId,
        name: pass.customer?.name ?? 'Unknown Customer',
        phone: pass.customer?.phone ?? '',
      },
      items,
      subtotalAmount: Number(pass.subtotalAmount),
      discountType: pass.discountType,
      discountValue: Number(pass.discountValue),
      discountAmount: Number(pass.discountAmount),
      finalAmount: Number(pass.finalAmount),
      employee: {
        id: pass.generatedByUser?.id ?? pass.generatedByUserId,
        name: pass.generatedByUser?.name ?? 'Unknown Employee',
      },
      status: computedStatus,
      createdAt: pass.createdAt,
      updatedAt: pass.updatedAt,
    };
  }
}
