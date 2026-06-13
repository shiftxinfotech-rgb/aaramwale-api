import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/user.entity";

@ApiTags("Admins")
@ApiBearerAuth("access-token")
@Controller("admins")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: "Create a new admin",
    description: `**Role:** SUPER_ADMIN only\n\nCreates a new ADMIN user. The \`role\` field is ignored — created users are always ADMIN. The \`outletId\` field is ignored — admins never belong to an outlet.`,
  })
  @ApiResponse({ status: 201, description: "Admin created successfully" })
  @ApiResponse({
    status: 400,
    description: "Email already exists or validation failed",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({
    status: 403,
    description: "Forbidden — SUPER_ADMIN role required",
  })
  async create(@Body() createAdminDto: CreateAdminDto) {
    const data = await this.adminService.create(createAdminDto);
    return {
      message: "Admin created successfully",
      data,
    };
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: "Get all admins",
    description:
      "**Role:** SUPER_ADMIN only\n\nReturns a list of all ADMIN users sorted by creation date (newest first).",
  })
  @ApiResponse({
    status: 200,
    description: "List of admins returned successfully",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({
    status: 403,
    description: "Forbidden — SUPER_ADMIN role required",
  })
  async findAll() {
    const data = await this.adminService.findAll();
    return {
      message: "Admins retrieved successfully",
      data,
    };
  }

  // ─── GET BY ID ────────────────────────────────────────────────────────────────

  @Get(":id")
  @ApiOperation({
    summary: "Get an admin by ID",
    description: "**Role:** SUPER_ADMIN only",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 2,
    description: "Admin user ID",
  })
  @ApiResponse({ status: 200, description: "Admin details" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({
    status: 403,
    description: "Forbidden — SUPER_ADMIN role required",
  })
  @ApiResponse({ status: 404, description: "Admin not found" })
  async findOne(@Param("id") id: string) {
    const data = await this.adminService.findOne(+id);
    return {
      message: "Admin retrieved successfully",
      data,
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────────

  @Patch(":id")
  @ApiOperation({
    summary: "Update an admin",
    description:
      "**Role:** SUPER_ADMIN only\n\nUpdate admin name, password, or active status. Role and outletId cannot be changed.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 2,
    description: "Admin user ID",
  })
  @ApiResponse({ status: 200, description: "Admin updated successfully" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({
    status: 403,
    description: "Forbidden — SUPER_ADMIN role required",
  })
  @ApiResponse({ status: 404, description: "Admin not found" })
  async update(
    @Param("id") id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    const data = await this.adminService.update(+id, updateAdminDto);
    return {
      message: "Admin updated successfully",
      data,
    };
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────

  @Delete(":id")
  @ApiOperation({
    summary: "Delete an admin",
    description:
      "**Role:** SUPER_ADMIN only\n\nPermanently deletes an admin user.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 2,
    description: "Admin user ID",
  })
  @ApiResponse({ status: 200, description: "Admin deleted successfully" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({
    status: 403,
    description: "Forbidden — SUPER_ADMIN role required",
  })
  @ApiResponse({ status: 404, description: "Admin not found" })
  async remove(@Param("id") id: string) {
    await this.adminService.remove(+id);
    return {
      message: "Admin deleted successfully",
      data: null,
    };
  }
}
