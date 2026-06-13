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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomerResponseDto } from "./dto/customer-response.dto";
import { CustomerListQueryDto } from "./dto/customer-list-query.dto";
import { CustomerProfileResponseDto } from "./dto/customer-profile-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { UserRole } from "../users/user.entity";

@ApiTags("Customers")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Create a new customer",
    description: `**Role:** ADMIN / EMPLOYEE\n\n- **EMPLOYEE:** \`outletId\` is automatically set to the employee's outlet — any supplied value is ignored.\n- **ADMIN:** Can specify any valid \`outletId\`.`,
  })
  @ApiResponse({
    status: 201,
    description: "Customer created successfully",
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Mobile number already exists, invalid outletId, or validation failed",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @GetUser() user: any,
  ) {
    const data = await this.customersService.create(createCustomerDto, user);
    return {
      message: "Customer created successfully",
      data,
    };
  }

  // ─── SEARCH ───────────────────────────────────────────────────────────────────

  @Get("search")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Quick search customers by name or mobile",
    description:
      "**Role:** All authenticated roles\n\nOptimised for the mobile app pass-generation flow. EMPLOYEE results are automatically scoped to their outlet.",
  })
  @ApiQuery({
    name: "q",
    required: true,
    example: "Rahul",
    description: "Customer name or mobile number",
  })
  @ApiResponse({ status: 200, description: "Matching customers" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  async search(@Query("q") q: string, @GetUser() user: any) {
    const filterOutletId =
      user.role === UserRole.EMPLOYEE ? user.outletId : undefined;
    const data = await this.customersService.search(q, filterOutletId);
    return {
      message: "Customer search results",
      data,
    };
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "List all customers with pagination, search and filters",
    description:
      "**Role:** All authenticated roles\n\nEMPLOYEEs see only customers belonging to their outlet. Supports \`page\`, \`limit\`, \`search\`, \`outletId\`.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated customer list",
    type: [CustomerResponseDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  async findAll(@Query() query: CustomerListQueryDto, @GetUser() user: any) {
    const filterOutletId =
      user.role === UserRole.EMPLOYEE ? user.outletId : undefined;
    const data = await this.customersService.findAll(query, filterOutletId);
    return {
      message: "Customers retrieved successfully",
      data,
    };
  }

  // ─── GET BY ID ────────────────────────────────────────────────────────────────

  @Get(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Get full customer profile by ID",
    description:
      "**Role:** All authenticated roles\n\nReturns the customer's profile including all passes, walk-ins, and outlet info.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 11,
    description: "Customer ID",
  })
  @ApiResponse({
    status: 200,
    description: "Customer profile",
    type: CustomerProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({
    status: 403,
    description:
      "Forbidden — EMPLOYEE cannot access customers outside their outlet",
  })
  @ApiResponse({ status: 404, description: "Customer not found" })
  async findOne(@Param("id") id: string, @GetUser() user: any) {
    const data = await this.customersService.findOneProfile(+id, user);
    return {
      message: "Customer retrieved successfully",
      data,
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────────

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Update customer details",
    description: "**Role:** ADMIN / EMPLOYEE",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 11,
    description: "Customer ID",
  })
  @ApiResponse({
    status: 200,
    description: "Customer updated successfully",
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Customer not found" })
  async update(
    @Param("id") id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    const data = await this.customersService.update(+id, updateCustomerDto);
    return {
      message: "Customer updated successfully",
      data,
    };
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Delete a customer",
    description: "**Role:** ADMIN only",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 11,
    description: "Customer ID",
  })
  @ApiResponse({ status: 200, description: "Customer deleted successfully" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  @ApiResponse({ status: 404, description: "Customer not found" })
  async remove(@Param("id") id: string) {
    await this.customersService.remove(+id);
    return {
      message: "Customer deleted successfully",
      data: null,
    };
  }
}
