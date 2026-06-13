import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { EmployeesService } from "./employees.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeeResponseDto } from "./dto/employee-response.dto";
import { EmployeeListQueryDto } from "./dto/employee-list-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/user.entity";
import { GetUser } from "../auth/decorators/get-user.decorator";

@ApiTags("Employees")
@ApiBearerAuth("access-token")
@Controller("employees")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: "Create a new employee",
    description: `**Role:** ADMIN only\n\nCreates a new EMPLOYEE user. When called by an ADMIN, \`outletId\` is automatically set to the admin's outlet — any \`outletId\` passed in the body is ignored. Password is hashed automatically.`,
  })
  @ApiResponse({
    status: 201,
    description: "Employee created successfully",
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Validation failed, duplicate email, or invalid outletId",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @GetUser() user: any,
  ) {
    const data = await this.employeesService.create(createEmployeeDto, user);
    return {
      message: "Employee created successfully",
      data,
    };
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: "List all employees with pagination, search and filters",
    description: `**Role:** ADMIN (sees employees of their outlets) / SUPER_ADMIN (sees all)\n\nSupports pagination (\`page\`, \`limit\`), full-text \`search\` on name/email/mobile, filtering by \`outletId\`, \`role\`, and \`status\`.`,
  })
  @ApiResponse({
    status: 200,
    description: "Paginated employee list",
    type: [EmployeeResponseDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async findAll(@Query() query: EmployeeListQueryDto, @GetUser() user: any) {
    const data = await this.employeesService.findAll(query, user);
    return {
      message: "Employees retrieved successfully",
      data,
    };
  }

  // ─── GET BY OUTLET ────────────────────────────────────────────────────────────

  @Get("outlet/:outletId")
  @ApiOperation({
    summary: "Get all employees for a specific outlet",
    description: "**Role:** ADMIN / SUPER_ADMIN",
  })
  @ApiParam({
    name: "outletId",
    type: Number,
    example: 1,
    description: "Outlet ID",
  })
  @ApiResponse({
    status: 200,
    description: "List of employees for the outlet",
    type: [EmployeeResponseDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async findByOutlet(
    @Param("outletId") outletId: string,
    @GetUser() user: any,
  ) {
    const data = await this.employeesService.findByOutlet(+outletId);
    return {
      message: "Employees for outlet retrieved successfully",
      data,
    };
  }

  // ─── GET BY ID ────────────────────────────────────────────────────────────────

  @Get(":id")
  @ApiOperation({
    summary: "Get employee by ID",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nIncludes attendance clock-in status.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 3,
    description: "Employee user ID",
  })
  @ApiResponse({
    status: 200,
    description: "Employee details",
    type: EmployeeResponseDto,
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Employee not found" })
  async findOne(@Param("id") id: string, @GetUser() user: any) {
    const data = await this.employeesService.findOne(+id, user);
    return {
      message: "Employee retrieved successfully",
      data,
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────────

  @Patch(":id")
  @ApiOperation({
    summary: "Update an employee",
    description: `**Role:** ADMIN only\n\nUpdate name, password, mobile, or active status. ADMIN cannot change the employee's outlet to a different outlet.`,
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 3,
    description: "Employee user ID",
  })
  @ApiResponse({
    status: 200,
    description: "Employee updated successfully",
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Validation failed or invalid outletId",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Employee not found" })
  async update(
    @Param("id") id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @GetUser() user: any,
  ) {
    const data = await this.employeesService.update(
      +id,
      updateEmployeeDto,
      user,
    );
    return {
      message: "Employee updated successfully",
      data,
    };
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────

  @Delete(":id")
  @ApiOperation({
    summary: "Delete an employee",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nPermanently deletes the employee record.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 3,
    description: "Employee user ID",
  })
  @ApiResponse({ status: 200, description: "Employee deleted successfully" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Employee not found" })
  async remove(@Param("id") id: string) {
    await this.employeesService.remove(+id);
    return {
      message: "Employee deleted successfully",
      data: null,
    };
  }
}
