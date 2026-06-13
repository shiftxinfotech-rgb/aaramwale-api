import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { User, UserRole } from "../users/user.entity";
import { Attendance } from "../attendance/attendance.entity";
import { Outlet } from "../outlets/outlet.entity";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeeListQueryDto } from "./dto/employee-list-query.dto";

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private dataSource: DataSource,
  ) {}

  // Helper: attach attendance status to employees
  private async attachAttendanceStatus(employees: User[]): Promise<any[]> {
    const employeeIds = employees.map((e) => e.id);

    if (employeeIds.length === 0) {
      return [];
    }

    // Get all active attendance sessions for these employees in one query
    const activeSessions = await this.attendanceRepository.find({
      where: employeeIds.map((id) => ({ userId: id, status: "PRESENT" })),
    });

    // Create a map for quick lookup
    const sessionMap = new Map<number, Attendance>();
    for (const session of activeSessions) {
      sessionMap.set(session.userId, session);
    }

    return employees.map((employee) => {
      const session = sessionMap.get(employee.id);
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        mobile: employee.mobile || null,
        role: employee.role,
        outletId: employee.outletId || null,
        outletName: employee.outlet?.name || null,
        isActive: employee.isActive,
        isClockedIn: !!session,
        lastClockIn: session ? session.clockIn : null,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      };
    });
  }

  async create(
    createEmployeeDto: CreateEmployeeDto,
    adminUser: any,
  ): Promise<any> {
    const { email, password, name, mobile, isActive } = createEmployeeDto;

    // ── Determine role and outletId based on caller's role ──────────────────
    let finalRole: UserRole;
    let finalOutletId: number | null;

    if (adminUser.role === UserRole.ADMIN) {
      // ADMIN can only create EMPLOYEE — ignore any role passed
      if (
        createEmployeeDto.role &&
        createEmployeeDto.role !== UserRole.EMPLOYEE
      ) {
        throw new BadRequestException(
          "Admins can only create employees with the EMPLOYEE role",
        );
      }
      finalRole = UserRole.EMPLOYEE;
      // ADMIN must supply outletId in the request body (admin JWT has outletId=null)
      if (!createEmployeeDto.outletId) {
        throw new BadRequestException(
          "outletId is required when creating an employee",
        );
      }
      finalOutletId = createEmployeeDto.outletId;
    } else if (adminUser.role === UserRole.SUPER_ADMIN) {
      finalRole = createEmployeeDto.role || UserRole.ADMIN;
      if (finalRole === UserRole.SUPER_ADMIN) {
        throw new BadRequestException("You cannot create SUPER_ADMIN users");
      }
      if (finalRole === UserRole.EMPLOYEE && !createEmployeeDto.outletId) {
        throw new BadRequestException(
          "outletId is required when creating an employee",
        );
      }
      finalOutletId =
        finalRole === UserRole.EMPLOYEE ? createEmployeeDto.outletId! : null;
    } else {
      throw new BadRequestException("Insufficient permissions to create users");
    }

    // ── Validate outlet exists ───────────────────────────────────────────────
    if (finalOutletId) {
      const outlet = await this.dataSource.getRepository(Outlet).findOne({
        where: { id: finalOutletId },
      });
      if (!outlet) {
        throw new BadRequestException(
          `Outlet with ID ${finalOutletId} does not exist`,
        );
      }
    }

    // ── Check duplicate email ────────────────────────────────────────────────
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException("Employee with this email already exists");
    }

    // ── Create & save ────────────────────────────────────────────────────────
    const employee = this.userRepository.create({
      name,
      email,
      password,
      ...(mobile ? { mobile } : {}),
      isActive: isActive !== undefined ? isActive : true,
      role: finalRole,
      outletId: finalOutletId,
    });

    const savedEmployee = await this.userRepository.save(employee);

    // Reload with outlet relation to return outletName
    const fullEmployee = await this.userRepository.findOne({
      where: { id: savedEmployee.id },
      relations: ["outlet"],
    });

    if (!fullEmployee) {
      throw new NotFoundException(
        `Employee with ID ${savedEmployee.id} not found after save`,
      );
    }

    const [enriched] = await this.attachAttendanceStatus([fullEmployee]);
    return enriched;
  }

  async findAll(query: EmployeeListQueryDto, adminUser: any): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "DESC",
      status,
      outletId,
      role,
    } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.outlet", "outlet");

    if (adminUser.role === UserRole.ADMIN) {
      // ADMIN sees only their outlet's employees
      queryBuilder.andWhere("user.outletId = :outletId", {
        outletId: adminUser.outletId,
      });
      queryBuilder.andWhere("user.role = :role", { role: UserRole.EMPLOYEE });
    } else {
      // SUPER_ADMIN sees all users; filter by outletId/role if provided
      if (outletId) {
        queryBuilder.andWhere("user.outletId = :outletId", { outletId });
      }
      if (role) {
        queryBuilder.andWhere("user.role = :role", { role });
      } else {
        // Default: exclude SUPER_ADMIN from listing
        queryBuilder.andWhere("user.role != :role", {
          role: UserRole.SUPER_ADMIN,
        });
      }
    }

    if (status) {
      const isActive = status === "ACTIVE";
      queryBuilder.andWhere("user.isActive = :isActive", { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        "(user.name ILIKE :search OR user.email ILIKE :search OR user.mobile ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    const allowedSortFields = [
      "id",
      "name",
      "email",
      "role",
      "isActive",
      "createdAt",
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const order = sortOrder === "ASC" ? "ASC" : "DESC";

    queryBuilder.orderBy(`user.${sortField}`, order);

    const totalRecords = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * limit).take(limit);

    const employees = await queryBuilder.getMany();
    const enrichedEmployees = await this.attachAttendanceStatus(employees);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: enrichedEmployees,
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

  async findByOutlet(outletId: number): Promise<any[]> {
    const employees = await this.userRepository.find({
      where: { outletId, role: UserRole.EMPLOYEE },
      relations: ["outlet"],
      order: { createdAt: "DESC" },
    });

    return this.attachAttendanceStatus(employees);
  }

  async findOne(id: number, adminUser: any): Promise<any> {
    const employee = await this.userRepository.findOne({
      where: { id },
      relations: ["outlet"],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (adminUser.role === UserRole.ADMIN) {
      if (employee.role !== UserRole.EMPLOYEE) {
        throw new ForbiddenException("You can only view employees");
      }
      if (employee.outletId !== adminUser.outletId) {
        throw new ForbiddenException(
          "You can only view employees of your outlet",
        );
      }
    } else if (adminUser.role === UserRole.SUPER_ADMIN) {
      if (
        employee.role === UserRole.SUPER_ADMIN &&
        employee.id !== adminUser.id
      ) {
        throw new ForbiddenException("You cannot view other Super Admins");
      }
    }

    const [enriched] = await this.attachAttendanceStatus([employee]);
    return enriched;
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
    adminUser: any,
  ): Promise<any> {
    const employee = await this.userRepository.findOne({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (adminUser.role === UserRole.ADMIN) {
      if (employee.role !== UserRole.EMPLOYEE) {
        throw new ForbiddenException("You can only update employees");
      }
      if (employee.outletId !== adminUser.outletId) {
        throw new ForbiddenException(
          "You can only update employees of your outlet",
        );
      }
      if (
        updateEmployeeDto.role &&
        updateEmployeeDto.role !== UserRole.EMPLOYEE
      ) {
        throw new BadRequestException(
          "You cannot assign roles other than EMPLOYEE",
        );
      }
      updateEmployeeDto.role = UserRole.EMPLOYEE;
    } else if (adminUser.role === UserRole.SUPER_ADMIN) {
      if (
        employee.role === UserRole.SUPER_ADMIN &&
        employee.id !== adminUser.id
      ) {
        throw new ForbiddenException(
          "You cannot update other SUPER_ADMIN users",
        );
      }
      if (updateEmployeeDto.role === UserRole.SUPER_ADMIN) {
        throw new BadRequestException("You cannot assign the SUPER_ADMIN role");
      }
    }

    if (updateEmployeeDto.outletId !== undefined) {
      if (updateEmployeeDto.outletId === null) {
        const targetRole = updateEmployeeDto.role || employee.role;
        if (targetRole === UserRole.EMPLOYEE) {
          throw new BadRequestException("outletId is required for employees");
        }
      } else {
        // Validate outlet exists
        const outlet = await this.dataSource.getRepository(Outlet).findOne({
          where: { id: updateEmployeeDto.outletId },
        });
        if (!outlet) {
          throw new BadRequestException(
            `Outlet with ID ${updateEmployeeDto.outletId} does not exist`,
          );
        }
      }
    }

    Object.assign(employee, updateEmployeeDto);
    await this.userRepository.save(employee);

    // Reload with relations
    const fullEmployee = await this.userRepository.findOne({
      where: { id },
      relations: ["outlet"],
    });

    if (!fullEmployee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const [enriched] = await this.attachAttendanceStatus([fullEmployee]);
    return enriched;
  }

  async remove(id: number): Promise<void> {
    const employee = await this.userRepository.findOne({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (employee.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Super Admin cannot be deleted");
    }

    await this.userRepository.remove(employee);
  }
}
