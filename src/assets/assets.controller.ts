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
import { AssetsService } from "./assets.service";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { UpdateAssetDto } from "./dto/update-asset.dto";
import { AssetResponseDto } from "./dto/asset-response.dto";
import { AssetListQueryDto } from "./dto/asset-list-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/user.entity";
import { GetUser } from "../auth/decorators/get-user.decorator";

@ApiTags("Assets")
@ApiBearerAuth("access-token")
@Controller("assets")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Create a new asset",
    description:
      '**Role:** ADMIN only\n\nAssets are rentable items (e.g., "Treadmill A1", "Massage Chair 2"). Each asset belongs to an outlet and a category.',
  })
  @ApiResponse({
    status: 201,
    description: "Asset created successfully",
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Asset code already exists at this outlet or validation failed",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  async create(@Body() createAssetDto: CreateAssetDto) {
    const data = await this.assetsService.create(createAssetDto);
    return {
      message: "Asset created successfully",
      data,
    };
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "List all assets with pagination, search and filters",
    description:
      "**Role:** All authenticated roles\n\nEMPLOYEEs automatically see only assets for their outlet. Supports `page`, `limit`, `search`, `outletId`, `categoryId`, and `status` filtering.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated list of assets",
    type: [AssetResponseDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  async findAll(
    @Query() query: AssetListQueryDto,
    @GetUser() user: { id: number; role: UserRole; outletId?: number },
  ) {
    if (user.role === UserRole.EMPLOYEE) {
      query.outletId = user.outletId;
    }
    const data = (await this.assetsService.findAll(query)) as unknown;
    return {
      message: "Assets retrieved successfully",
      data,
    };
  }

  // ─── GET BY OUTLET ────────────────────────────────────────────────────────────

  @Get("outlet/:outletId")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Get all assets for a specific outlet",
    description:
      "**Role:** All authenticated roles\n\nUseful for populating asset dropdowns in pass/walk-in forms scoped to a specific outlet.",
  })
  @ApiParam({
    name: "outletId",
    type: Number,
    example: 1,
    description: "Outlet ID",
  })
  @ApiResponse({
    status: 200,
    description: "List of assets for the outlet",
    type: [AssetResponseDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  async findByOutlet(
    @Param("outletId") outletId: string,
    @GetUser() user: { id: number; role: UserRole; outletId?: number },
  ) {
    let targetOutletId = +outletId;
    if (user.role === UserRole.EMPLOYEE && user.outletId) {
      targetOutletId = user.outletId;
    }
    const data = (await this.assetsService.findByOutlet(
      targetOutletId,
    )) as unknown;
    return {
      message: "Assets for outlet retrieved successfully",
      data,
    };
  }

  // ─── GET BY CATEGORY ──────────────────────────────────────────────────────────

  @Get("category/:categoryId")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Get all assets for a specific category",
    description: "**Role:** All authenticated roles",
  })
  @ApiParam({
    name: "categoryId",
    type: Number,
    example: 2,
    description: "Category ID",
  })
  @ApiResponse({
    status: 200,
    description: "List of assets for the category",
    type: [AssetResponseDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  async findByCategory(
    @Param("categoryId") categoryId: string,
    @GetUser() user: { id: number; role: UserRole; outletId?: number },
  ) {
    let data: unknown;
    if (user.role === UserRole.EMPLOYEE && user.outletId) {
      data = (await this.assetsService.findByOutletAndCategory(
        user.outletId,
        +categoryId,
      )) as unknown;
    } else {
      data = (await this.assetsService.findByCategory(+categoryId)) as unknown;
    }
    return {
      message: "Assets for category retrieved successfully",
      data,
    };
  }

  // ─── GET BY OUTLET + CATEGORY ─────────────────────────────────────────────────

  @Get("outlet/:outletId/category/:categoryId")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Get assets filtered by outlet AND category",
    description:
      "**Role:** All authenticated roles\n\nKey endpoint for pass/walk-in generation — returns only assets matching both the customer's outlet and a selected category.",
  })
  @ApiParam({
    name: "outletId",
    type: Number,
    example: 1,
    description: "Outlet ID",
  })
  @ApiParam({
    name: "categoryId",
    type: Number,
    example: 2,
    description: "Category ID",
  })
  @ApiResponse({
    status: 200,
    description: "Filtered asset list",
    type: [AssetResponseDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  async findByOutletAndCategory(
    @Param("outletId") outletId: string,
    @Param("categoryId") categoryId: string,
    @GetUser() user: { id: number; role: UserRole; outletId?: number },
  ) {
    let targetOutletId = +outletId;
    if (user.role === UserRole.EMPLOYEE && user.outletId) {
      targetOutletId = user.outletId;
    }
    const data = (await this.assetsService.findByOutletAndCategory(
      targetOutletId,
      +categoryId,
    )) as unknown;
    return {
      message: "Assets for outlet and category retrieved successfully",
      data,
    };
  }

  // ─── GET BY ID ────────────────────────────────────────────────────────────────

  @Get(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Get asset by ID",
    description: "**Role:** All authenticated roles",
  })
  @ApiParam({ name: "id", type: Number, example: 5, description: "Asset ID" })
  @ApiResponse({
    status: 200,
    description: "Asset details",
    type: AssetResponseDto,
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 404, description: "Asset not found" })
  async findOne(
    @Param("id") id: string,
    @GetUser() user: { id: number; role: UserRole; outletId?: number },
  ) {
    const data = (await this.assetsService.findOne(+id)) as {
      outletId?: number;
    } | null;
    if (
      user.role === UserRole.EMPLOYEE &&
      data &&
      data.outletId !== user.outletId
    ) {
      throw new ForbiddenException(
        "You do not have permission to access this asset",
      );
    }
    return {
      message: "Asset retrieved successfully",
      data,
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────────

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update an asset",
    description: "**Role:** ADMIN only",
  })
  @ApiParam({ name: "id", type: Number, example: 5, description: "Asset ID" })
  @ApiResponse({
    status: 200,
    description: "Asset updated successfully",
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Validation failed or duplicate asset code",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  @ApiResponse({ status: 404, description: "Asset not found" })
  async update(
    @Param("id") id: string,
    @Body() updateAssetDto: UpdateAssetDto,
  ) {
    const data = await this.assetsService.update(+id, updateAssetDto);
    return {
      message: "Asset updated successfully",
      data,
    };
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Delete an asset",
    description: "**Role:** ADMIN only",
  })
  @ApiParam({ name: "id", type: Number, example: 5, description: "Asset ID" })
  @ApiResponse({ status: 200, description: "Asset deleted successfully" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  @ApiResponse({ status: 404, description: "Asset not found" })
  async remove(@Param("id") id: string) {
    await this.assetsService.remove(+id);
    return {
      message: "Asset deleted successfully",
      data: null,
    };
  }
}
