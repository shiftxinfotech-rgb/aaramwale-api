import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Customer } from './customer.entity';
import { Pass } from '../passes/pass.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerListQueryDto } from './dto/customer-list-query.dto';
import { CustomerProfileResponseDto } from './dto/customer-profile-response.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    private dataSource: DataSource,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const existingCustomer = await this.customersRepository.findOne({
      where: { phone: createCustomerDto.phone },
    });

    if (existingCustomer) {
      throw new ConflictException('Customer with this phone number already exists');
    }

    const customer = this.customersRepository.create(createCustomerDto);
    return await this.customersRepository.save(customer);
  }

  async search(q: string, outletId?: number): Promise<any[]> {
    if (!q || q.trim().length === 0) {
      return [];
    }

    const queryBuilder = this.customersRepository.createQueryBuilder('customer')
      .select(['customer.id', 'customer.name', 'customer.phone', 'customer.email'])
      .where('(customer.name ILIKE :q OR customer.phone ILIKE :q)', { q: `%${q.trim()}%` })
      .orderBy('customer.name', 'ASC')
      .limit(20);

    if (outletId) {
      queryBuilder.andWhere(
        `EXISTS (SELECT 1 FROM passes p WHERE p."customerId" = customer.id AND p."outletId" = :outletId)`,
        { outletId }
      );
    }

    return queryBuilder.getMany();
  }

  async findAll(query: CustomerListQueryDto, employeeOutletId?: number): Promise<any> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC', mobile, outletId, fromDate, toDate } = query;

    const queryBuilder = this.customersRepository.createQueryBuilder('customer');
    const activeOutletId = employeeOutletId || outletId;

    if (activeOutletId || fromDate || toDate) {
      let joinCondition = 'pass.customerId = customer.id';
      if (activeOutletId) {
        joinCondition += ' AND pass.outletId = :activeOutletId';
        queryBuilder.setParameter('activeOutletId', activeOutletId);
      }
      if (fromDate) {
        joinCondition += ' AND pass.createdAt >= :fromDate';
        queryBuilder.setParameter('fromDate', new Date(`${fromDate}T00:00:00.000Z`));
      }
      if (toDate) {
        joinCondition += ' AND pass.createdAt <= :toDate';
        queryBuilder.setParameter('toDate', new Date(`${toDate}T23:59:59.999Z`));
      }

      queryBuilder.leftJoin('passes', 'pass', joinCondition);

      if (activeOutletId && !fromDate && !toDate) {
        queryBuilder.andWhere('(customer.outletId = :activeOutletId OR pass.id IS NOT NULL)');
      } else {
        queryBuilder.andWhere('pass.id IS NOT NULL');
      }
    } else {
      queryBuilder.leftJoin('passes', 'pass', 'pass.customerId = customer.id');
    }

    if (search) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (mobile) {
      queryBuilder.andWhere('customer.phone = :mobile', { mobile });
    }

    queryBuilder.select([
      'customer.id AS id',
      'customer.name AS name',
      'customer.phone AS mobile',
    ]);

    queryBuilder.addSelect('COALESCE(COUNT(pass.id), 0)::int', 'totalPasses');
    queryBuilder.addSelect('COALESCE(SUM(pass.finalAmount), 0)::float', 'totalSpent');
    queryBuilder.addSelect('MAX(pass.createdAt)', 'lastVisitDate');

    queryBuilder.addSelect((subQuery) => {
      const q = subQuery
        .select('o.name')
        .from('passes', 'p')
        .innerJoin('outlets', 'o', 'o.id = p.outletId')
        .where('p.customerId = customer.id');
      
      if (activeOutletId) {
        q.andWhere('p.outletId = :subQueryOutletId', { subQueryOutletId: activeOutletId });
      }
      if (fromDate) {
        q.andWhere('p.createdAt >= :subQueryFromDate', { subQueryFromDate: new Date(`${fromDate}T00:00:00.000Z`) });
      }
      if (toDate) {
        q.andWhere('p.createdAt <= :subQueryToDate', { subQueryToDate: new Date(`${toDate}T23:59:59.999Z`) });
      }
      
      return q.orderBy('p.createdAt', 'DESC').limit(1);
    }, 'outletName');

    queryBuilder.groupBy('customer.id')
      .addGroupBy('customer.name')
      .addGroupBy('customer.phone')
      .addGroupBy('customer.createdAt');

    // Count query
    const countQuery = this.customersRepository.createQueryBuilder('customer');
    if (activeOutletId || fromDate || toDate) {
      let joinCondition = 'pass.customerId = customer.id';
      if (activeOutletId) {
        joinCondition += ' AND pass.outletId = :activeOutletId';
        countQuery.setParameter('activeOutletId', activeOutletId);
      }
      if (fromDate) {
        joinCondition += ' AND pass.createdAt >= :fromDate';
        countQuery.setParameter('fromDate', new Date(`${fromDate}T00:00:00.000Z`));
      }
      if (toDate) {
        joinCondition += ' AND pass.createdAt <= :toDate';
        countQuery.setParameter('toDate', new Date(`${toDate}T23:59:59.999Z`));
      }

      countQuery.leftJoin('passes', 'pass', joinCondition);

      if (activeOutletId && !fromDate && !toDate) {
        countQuery.andWhere('(customer.outletId = :activeOutletId OR pass.id IS NOT NULL)');
      } else {
        countQuery.andWhere('pass.id IS NOT NULL');
      }
    } else {
      countQuery.leftJoin('passes', 'pass', 'pass.customerId = customer.id');
    }

    if (search) {
      countQuery.andWhere(
        '(customer.name ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    if (mobile) {
      countQuery.andWhere('customer.phone = :mobile', { mobile });
    }

    const totalRecords = await countQuery
      .select('COUNT(DISTINCT customer.id)', 'count')
      .getRawOne()
      .then(res => parseInt(res.count || '0', 10));

    // Order By
    const allowedSortFields = ['id', 'name', 'mobile', 'totalPasses', 'totalSpent', 'lastVisitDate', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    if (sortField === 'mobile') {
      queryBuilder.orderBy('customer.phone', order);
    } else if (sortField === 'name') {
      queryBuilder.orderBy('customer.name', order);
    } else if (sortField === 'id') {
      queryBuilder.orderBy('customer.id', order);
    } else if (sortField === 'createdAt') {
      queryBuilder.orderBy('customer.createdAt', order);
    } else if (sortField === 'totalPasses') {
      queryBuilder.orderBy('"totalPasses"', order);
    } else if (sortField === 'totalSpent') {
      queryBuilder.orderBy('"totalSpent"', order);
    } else if (sortField === 'lastVisitDate') {
      queryBuilder.orderBy('"lastVisitDate"', order);
    }

    queryBuilder.offset((page - 1) * limit).limit(limit);

    const rawResults = await queryBuilder.getRawMany();

    const formattedData = rawResults.map(row => {
      let lastVisitDate: string | null = null;
      if (row.lastVisitDate) {
        const d = new Date(row.lastVisitDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        lastVisitDate = `${yyyy}-${mm}-${dd}`;
      }
      return {
        id: row.id,
        name: row.name,
        mobile: row.mobile,
        outletName: row.outletName || null,
        totalPasses: Number(row.totalPasses),
        totalSpent: Number(row.totalSpent),
        lastVisitDate,
      };
    });

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: formattedData,
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

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customersRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async findOneProfile(id: number, user: any): Promise<CustomerProfileResponseDto> {
    const customer = await this.findOne(id);

    if (user.role === 'EMPLOYEE') {
      const hasPassAtOutlet = await this.dataSource.getRepository(Pass).findOne({
        where: { customerId: id, outletId: user.outletId }
      });

      if (customer.outletId !== user.outletId && !hasPassAtOutlet) {
        throw new ForbiddenException('You do not have permission to access this customer');
      }
    }

    return {
      id: customer.id,
      name: customer.name,
      mobile: customer.phone,
      email: customer.email || null,
      gender: customer.gender || null,
      birthday: customer.birthday || null,
      city: customer.city || null,
      state: customer.state || null,
      area: customer.area || null,
      latitude: customer.latitude ? Number(customer.latitude) : null,
      longitude: customer.longitude ? Number(customer.longitude) : null,
      notes: customer.notes || null,
      loyalty_points: customer.loyaltyPoints || 0,
      total_appointments: customer.totalAppointments || 0,
      last_visit_date: customer.lastVisitDate || null,
      active_membership_id: customer.activeMembershipId || null,
      membership_name: customer.membershipName || null,
      membership_expiry: customer.membershipExpiry || null,
      active_packages: customer.activePackages || 0,
      active_gift_cards: customer.activeGiftCards || 0,
    };
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    
    if (updateCustomerDto.phone && updateCustomerDto.phone !== customer.phone) {
      const existingCustomer = await this.customersRepository.findOne({
        where: { phone: updateCustomerDto.phone },
      });
      if (existingCustomer) {
        throw new ConflictException('Customer with this phone number already exists');
      }
    }

    Object.assign(customer, updateCustomerDto);
    return await this.customersRepository.save(customer);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findOne(id);
    await this.customersRepository.remove(customer);
  }
}
