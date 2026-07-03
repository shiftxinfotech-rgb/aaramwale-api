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
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryResponseDto } from "./dto/category-response.dto";
import { CategoryListQueryDto } from "./dto/category-list-query.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/user.entity";
import { GetUser } from "../auth/decorators/get-user.decorator";

@ApiTags("Categories")
@ApiBearerAuth("access-token")
@Controller("categories")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Create a new category",
    description:
      '**Role:** ADMIN only\n\nCategories are used to group assets (e.g., "Gym Equipment", "Spa Services").',
  })
  @ApiResponse({
    status: 201,
    description: "Category created successfully",
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Category name already exists or validation failed",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const data = await this.categoriesService.create(createCategoryDto);
    return {
      message: "Category created successfully",
      data,
    };
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "List all categories with pagination, search and filters",
    description:
      "**Role:** All authenticated roles\n\nEMPLOYEEs automatically see only categories for their outlet. Supports `page`, `limit`, `search`, `outletId`, and `status` filtering.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated list of categories",
    type: [CategoryResponseDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  async findAll(
    @Query() query: CategoryListQueryDto,
    @GetUser() user: { id: number; role: UserRole; outletId?: number },
  ) {
    if (user.role === UserRole.EMPLOYEE) {
      query.outletId = user.outletId;
      query.status = "ACTIVE";
    }
    const data = (await this.categoriesService.findAll(query)) as unknown;
    return {
      message: "Categories retrieved successfully",
      data,
    };
  }

  // ─── GET BY ID ────────────────────────────────────────────────────────────────

  @Get(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Get category by ID",
    description: "**Role:** All authenticated roles",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 1,
    description: "Category ID",
  })
  @ApiResponse({
    status: 200,
    description: "Category details",
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 404, description: "Category not found" })
  async findOne(@Param("id") id: string) {
    const data = await this.categoriesService.findOne(+id);
    return {
      message: "Category retrieved successfully",
      data,
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────────

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update a category",
    description: "**Role:** ADMIN only",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 1,
    description: "Category ID",
  })
  @ApiResponse({
    status: 200,
    description: "Category updated successfully",
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Validation failed or name already exists",
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  @ApiResponse({ status: 404, description: "Category not found" })
  async update(
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const data = await this.categoriesService.update(+id, updateCategoryDto);
    return {
      message: "Category updated successfully",
      data,
    };
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Delete a category",
    description:
      "**Role:** ADMIN only\n\nDeleting a category will affect assets assigned to it.",
  })
  @ApiParam({
    name: "id",
    type: Number,
    example: 1,
    description: "Category ID",
  })
  @ApiResponse({ status: 200, description: "Category deleted successfully" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  @ApiResponse({ status: 404, description: "Category not found" })
  async remove(@Param("id") id: string) {
    await this.categoriesService.remove(+id);
    return {
      message: "Category deleted successfully",
      data: null,
    };
  }
}
