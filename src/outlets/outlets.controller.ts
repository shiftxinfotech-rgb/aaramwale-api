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
} from "@nestjs/swagger";
import { OutletsService } from "./outlets.service";
import { CreateOutletDto } from "./dto/create-outlet.dto";
import { UpdateOutletDto } from "./dto/update-outlet.dto";
import { OutletResponseDto } from "./dto/outlet-response.dto";
import { OutletListQueryDto } from "./dto/outlet-list-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/user.entity";

@ApiTags("Outlets")
@ApiBearerAuth("access-token")
@Controller("outlets")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Create a new outlet",
    description:
      "**Role:** ADMIN only\n\nCreates a new physical outlet/branch for the business.",
  })
  @ApiResponse({
    status: 201,
    description: "Outlet created successfully",
    type: OutletResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Validation failed or outlet name already exists",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  async create(@Body() createOutletDto: CreateOutletDto) {
    const data = await this.outletsService.create(createOutletDto);
    return {
      message: "Outlet created successfully",
      data,
    };
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "List all outlets with pagination, search and filters",
    description:
      "**Role:** All authenticated roles\n\nSupports \`page\`, \`limit\`, \`search\`, and \`status\` filtering.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated list of outlets",
    type: [OutletResponseDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  async findAll(@Query() query: OutletListQueryDto) {
    const data = await this.outletsService.findAll(query);
    return {
      message: "Outlets retrieved successfully",
      data,
    };
  }

  // ─── GET BY ID ────────────────────────────────────────────────────────────────

  @Get(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Get outlet by ID",
    description: "**Role:** All authenticated roles",
  })
  @ApiParam({ name: "id", type: Number, example: 1, description: "Outlet ID" })
  @ApiResponse({
    status: 200,
    description: "Outlet details",
    type: OutletResponseDto,
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 404, description: "Outlet not found" })
  async findOne(@Param("id") id: string) {
    const data = await this.outletsService.findOne(+id);
    return {
      message: "Outlet retrieved successfully",
      data,
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────────

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update an outlet",
    description: "**Role:** ADMIN only",
  })
  @ApiParam({ name: "id", type: Number, example: 1, description: "Outlet ID" })
  @ApiResponse({
    status: 200,
    description: "Outlet updated successfully",
    type: OutletResponseDto,
  })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  @ApiResponse({ status: 404, description: "Outlet not found" })
  async update(
    @Param("id") id: string,
    @Body() updateOutletDto: UpdateOutletDto,
  ) {
    const data = await this.outletsService.update(+id, updateOutletDto);
    return {
      message: "Outlet updated successfully",
      data,
    };
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Delete an outlet",
    description:
      "**Role:** ADMIN only\n\nPermanently deletes an outlet. This will also affect any employees and data associated with it.",
  })
  @ApiParam({ name: "id", type: Number, example: 1, description: "Outlet ID" })
  @ApiResponse({ status: 200, description: "Outlet deleted successfully" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  @ApiResponse({ status: 404, description: "Outlet not found" })
  async remove(@Param("id") id: string) {
    await this.outletsService.remove(+id);
    return {
      message: "Outlet deleted successfully",
      data: null,
    };
  }
}
