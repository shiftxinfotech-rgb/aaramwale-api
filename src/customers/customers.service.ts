import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Customer } from "./customer.entity";
import { Pass } from "../passes/pass.entity";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomerListQueryDto } from "./dto/customer-list-query.dto";
import { CustomerProfileResponseDto } from "./dto/customer-profile-response.dto";
import { OutletsService } from "../outlets/outlets.service";

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    private dataSource: DataSource,
    private outletsService: OutletsService,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    user?: { role: string; outletId?: number },
  ): Promise<any> {
    if (user && user.role === "EMPLOYEE") {
      if (
        createCustomerDto.outletId !== undefined &&
        createCustomerDto.outletId !== null &&
        createCustomerDto.outletId !== user.outletId
      ) {
        throw new BadRequestException(
          "Employee cannot create customer for another outlet",
        );
      }
      createCustomerDto.outletId = user.outletId;
    }

    if (createCustomerDto.outletId) {
      await this.outletsService.findOne(createCustomerDto.outletId);
    }

    const mobileNum = createCustomerDto.mobile || createCustomerDto.phone;
    if (!mobileNum) {
      throw new BadRequestException("Mobile number is required");
    }
    createCustomerDto.mobile = mobileNum;

    const existingCustomer = await this.customersRepository.findOne({
      where: { mobile: createCustomerDto.mobile },
    });

    if (existingCustomer) {
      throw new ConflictException(
        "Customer with this mobile number already exists",
      );
    }

    const customer = this.customersRepository.create(createCustomerDto);
    await this.customersRepository.save(customer);

    // Reload with outlet relation so outletName is populated in response
    const full = await this.customersRepository.findOne({
      where: { id: customer.id },
      relations: ["outlet"],
    });

    return {
      ...full,
      outletName: full?.outlet?.name || null,
      outlet: full?.outlet
        ? { id: full.outlet.id, name: full.outlet.name }
        : null,
    };
  }

  async search(q: string, outletId?: number): Promise<any[]> {
    if (!q || q.trim().length === 0) {
      return [];
    }

    const queryBuilder = this.customersRepository
      .createQueryBuilder("customer")
      .leftJoin("customer.outlet", "outlet")
      .select([
        "customer.id",
        "customer.name",
        "customer.mobile",
        "customer.email",
        "customer.outletId",
        "outlet.id",
        "outlet.name",
      ])
      .where("(customer.name ILIKE :q OR customer.mobile ILIKE :q)", {
        q: `%${q.trim()}%`,
      })
      .orderBy("customer.name", "ASC")
      .limit(20);

    if (outletId) {
      queryBuilder.andWhere(
        `(customer.outletId = :outletId OR EXISTS (SELECT 1 FROM passes p WHERE p."customerId" = customer.id AND p."outletId" = :outletId))`,
        { outletId },
      );
    }

    const results = await queryBuilder.getMany();
    return results.map((c) => ({
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      email: c.email || null,
      outletId: c.outletId || null,
      outletName: c.outlet?.name || null,
    }));
  }

  async findAll(
    query: CustomerListQueryDto,
    employeeOutletId?: number,
  ): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "DESC",
      mobile,
      outletId,
      fromDate,
      toDate,
    } = query;

    const queryBuilder =
      this.customersRepository.createQueryBuilder("customer");
    const activeOutletId = employeeOutletId || outletId;

    if (activeOutletId || fromDate || toDate) {
      let joinCondition = "pass.customerId = customer.id";
      if (activeOutletId) {
        joinCondition += " AND pass.outletId = :activeOutletId";
        queryBuilder.setParameter("activeOutletId", activeOutletId);
      }
      if (fromDate) {
        joinCondition += " AND pass.createdAt >= :fromDate";
        queryBuilder.setParameter(
          "fromDate",
          new Date(`${fromDate}T00:00:00.000Z`),
        );
      }
      if (toDate) {
        joinCondition += " AND pass.createdAt <= :toDate";
        queryBuilder.setParameter(
          "toDate",
          new Date(`${toDate}T23:59:59.999Z`),
        );
      }

      queryBuilder.leftJoin("passes", "pass", joinCondition);

      if (activeOutletId && !fromDate && !toDate) {
        queryBuilder.andWhere(
          "(customer.outletId = :activeOutletId OR pass.id IS NOT NULL)",
        );
      } else {
        queryBuilder.andWhere("pass.id IS NOT NULL");
      }
    } else {
      queryBuilder.leftJoin("passes", "pass", "pass.customerId = customer.id");
    }

    if (search) {
      queryBuilder.andWhere(
        "(customer.name ILIKE :search OR customer.mobile ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (mobile) {
      queryBuilder.andWhere("customer.mobile = :mobile", { mobile });
    }

    queryBuilder.select([
      "customer.id AS id",
      "customer.name AS name",
      "customer.mobile AS mobile",
      'customer.outletId AS "outletId"',
    ]);

    queryBuilder.addSelect("COALESCE(COUNT(pass.id), 0)::int", "totalPasses");
    queryBuilder.addSelect(
      "COALESCE(SUM(pass.finalAmount), 0)::float",
      "totalSpent",
    );
    queryBuilder.addSelect("MAX(pass.createdAt)", "lastVisitDate");

    // Correlated subquery: get outlet name directly from customer.outletId (always reliable)
    queryBuilder.addSelect(
      `(SELECT o.name FROM outlets o WHERE o.id = customer."outletId" LIMIT 1)`,
      "outletName",
    );

    queryBuilder
      .groupBy("customer.id")
      .addGroupBy("customer.name")
      .addGroupBy("customer.mobile")
      .addGroupBy("customer.outletId")
      .addGroupBy("customer.createdAt");

    // Count query
    const countQuery = this.customersRepository.createQueryBuilder("customer");
    if (activeOutletId || fromDate || toDate) {
      let joinCondition = "pass.customerId = customer.id";
      if (activeOutletId) {
        joinCondition += " AND pass.outletId = :activeOutletId";
        countQuery.setParameter("activeOutletId", activeOutletId);
      }
      if (fromDate) {
        joinCondition += " AND pass.createdAt >= :fromDate";
        countQuery.setParameter(
          "fromDate",
          new Date(`${fromDate}T00:00:00.000Z`),
        );
      }
      if (toDate) {
        joinCondition += " AND pass.createdAt <= :toDate";
        countQuery.setParameter("toDate", new Date(`${toDate}T23:59:59.999Z`));
      }

      countQuery.leftJoin("passes", "pass", joinCondition);

      if (activeOutletId && !fromDate && !toDate) {
        countQuery.andWhere(
          "(customer.outletId = :activeOutletId OR pass.id IS NOT NULL)",
        );
      } else {
        countQuery.andWhere("pass.id IS NOT NULL");
      }
    } else {
      countQuery.leftJoin("passes", "pass", "pass.customerId = customer.id");
    }

    if (search) {
      countQuery.andWhere(
        "(customer.name ILIKE :search OR customer.mobile ILIKE :search)",
        { search: `%${search}%` },
      );
    }
    if (mobile) {
      countQuery.andWhere("customer.mobile = :mobile", { mobile });
    }

    const rawResult: { count?: string } | undefined = await countQuery
      .select("COUNT(DISTINCT customer.id)", "count")
      .getRawOne();
    const totalRecords = parseInt(rawResult?.count || "0", 10);

    // Order By
    const allowedSortFields = [
      "id",
      "name",
      "mobile",
      "totalPasses",
      "totalSpent",
      "lastVisitDate",
      "createdAt",
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const order = sortOrder === "ASC" ? "ASC" : "DESC";

    if (sortField === "mobile") {
      queryBuilder.orderBy("customer.mobile", order);
    } else if (sortField === "name") {
      queryBuilder.orderBy("customer.name", order);
    } else if (sortField === "id") {
      queryBuilder.orderBy("customer.id", order);
    } else if (sortField === "createdAt") {
      queryBuilder.orderBy("customer.createdAt", order);
    } else if (sortField === "totalPasses") {
      queryBuilder.orderBy('"totalPasses"', order);
    } else if (sortField === "totalSpent") {
      queryBuilder.orderBy('"totalSpent"', order);
    } else if (sortField === "lastVisitDate") {
      queryBuilder.orderBy('"lastVisitDate"', order);
    }

    queryBuilder.offset((page - 1) * limit).limit(limit);

    interface CustomerRawRow {
      id: number;
      name: string;
      mobile: string;
      outletId?: number;
      outletName?: string;
      totalPasses?: number | string;
      totalSpent?: number | string;
      lastVisitDate?: string | Date;
    }

    const rawResults: CustomerRawRow[] = await queryBuilder.getRawMany();

    const formattedData = rawResults.map((row) => {
      let lastVisitDate: string | null = null;
      if (row.lastVisitDate) {
        const d = new Date(row.lastVisitDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        lastVisitDate = `${yyyy}-${mm}-${dd}`;
      }
      return {
        id: row.id,
        name: row.name,
        mobile: row.mobile,
        outletId: row.outletId || null,
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

  async findOneProfile(
    id: number,
    user: { role: string; outletId?: number },
  ): Promise<CustomerProfileResponseDto> {
    // Load with outlet relation for outletName
    const customer = await this.customersRepository.findOne({
      where: { id },
      relations: ["outlet"],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (user.role === "EMPLOYEE") {
      const hasPassAtOutlet = await this.dataSource
        .getRepository(Pass)
        .findOne({
          where: { customerId: id, outletId: user.outletId },
        });

      if (customer.outletId !== user.outletId && !hasPassAtOutlet) {
        throw new ForbiddenException(
          "You do not have permission to access this customer",
        );
      }
    }

    return {
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || null,
      gender: customer.gender || null,
      birthday: customer.birthday || null,
      city: customer.city || null,
      state: customer.state || null,
      area: customer.area || null,
      notes: customer.notes || null,
      total_appointments: customer.totalAppointments || 0,
      last_visit_date: customer.lastVisitDate || null,
      outletId: customer.outletId || null,
      outletName: customer.outlet?.name || null,
      outlet: customer.outlet
        ? { id: customer.outlet.id, name: customer.outlet.name }
        : null,
    };
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    const mobileNum = updateCustomerDto.mobile || updateCustomerDto.phone;
    if (mobileNum !== undefined) {
      updateCustomerDto.mobile = mobileNum;
    }

    if (
      updateCustomerDto.mobile &&
      updateCustomerDto.mobile !== customer.mobile
    ) {
      const existingCustomer = await this.customersRepository.findOne({
        where: { mobile: updateCustomerDto.mobile },
      });
      if (existingCustomer) {
        throw new ConflictException(
          "Customer with this mobile number already exists",
        );
      }
    }

    if (updateCustomerDto.mobile !== undefined) {
      customer.mobile = updateCustomerDto.mobile;
    }
    Object.assign(customer, updateCustomerDto);

    return await this.customersRepository.save(customer);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findOne(id);
    await this.customersRepository.remove(customer);
  }
}
