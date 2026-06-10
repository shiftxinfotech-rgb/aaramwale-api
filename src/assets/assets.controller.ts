import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetResponseDto } from './dto/asset-response.dto';
import { AssetListQueryDto } from './dto/asset-list-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Assets')
@ApiBearerAuth('access-token')
@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new asset (Admin only)' })
  @ApiResponse({ status: 201, description: 'Asset created successfully', type: AssetResponseDto })
  @ApiResponse({ status: 400, description: 'Asset code already exists at this outlet or validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createAssetDto: CreateAssetDto) {
    const data = await this.assetsService.create(createAssetDto);
    return {
      message: 'Asset created successfully',
      data,
    };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all assets with pagination, search, status filter, and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated list of all assets' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: AssetListQueryDto) {
    const data = await this.assetsService.findAll(query);
    return {
      message: 'Assets retrieved successfully',
      data,
    };
  }

  @Get('outlet/:outletId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all assets by outlet' })
  @ApiResponse({ status: 200, description: 'List of assets for outlet', type: [AssetResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByOutlet(@Param('outletId') outletId: string) {
    const data = await this.assetsService.findByOutlet(+outletId);
    return {
      message: 'Assets for outlet retrieved successfully',
      data,
    };
  }

  @Get('category/:categoryId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all assets by category' })
  @ApiResponse({ status: 200, description: 'List of assets for category', type: [AssetResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByCategory(@Param('categoryId') categoryId: string) {
    const data = await this.assetsService.findByCategory(+categoryId);
    return {
      message: 'Assets for category retrieved successfully',
      data,
    };
  }

  @Get('outlet/:outletId/category/:categoryId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all assets by outlet and category' })
  @ApiResponse({ status: 200, description: 'List of assets for outlet and category', type: [AssetResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByOutletAndCategory(
    @Param('outletId') outletId: string,
    @Param('categoryId') categoryId: string,
  ) {
    const data = await this.assetsService.findByOutletAndCategory(+outletId, +categoryId);
    return {
      message: 'Assets for outlet and category retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get an asset by ID' })
  @ApiResponse({ status: 200, description: 'Asset details', type: AssetResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.assetsService.findOne(+id);
    return {
      message: 'Asset retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an asset (Admin only)' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully', type: AssetResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed or duplicate asset code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    const data = await this.assetsService.update(+id, updateAssetDto);
    return {
      message: 'Asset updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an asset (Admin only)' })
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async remove(@Param('id') id: string) {
    await this.assetsService.remove(+id);
    return {
      message: 'Asset deleted successfully',
      data: null,
    };
  }
}
