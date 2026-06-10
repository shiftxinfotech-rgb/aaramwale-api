import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OutletsService } from './outlets.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { OutletResponseDto } from './dto/outlet-response.dto';
import { OutletListQueryDto } from './dto/outlet-list-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Outlets')
@ApiBearerAuth('access-token')
@Controller('outlets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new outlet (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Outlet created successfully', type: OutletResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createOutletDto: CreateOutletDto) {
    const data = await this.outletsService.create(createOutletDto);
    return {
      message: 'Outlet created successfully',
      data,
    };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all outlets with pagination, search, status filter, and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated list of all outlets' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Add Bearer token from /auth/login' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@Query() query: OutletListQueryDto) {
    const data = await this.outletsService.findAll(query);
    return {
      message: 'Outlets retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get an outlet by ID (Login required for admin or employee)' })
  @ApiResponse({ status: 200, description: 'Outlet details', type: OutletResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized. Add Bearer token from /auth/login' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Outlet not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.outletsService.findOne(+id);
    return {
      message: 'Outlet retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an outlet (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Outlet updated successfully', type: OutletResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Outlet not found' })
  async update(@Param('id') id: string, @Body() updateOutletDto: UpdateOutletDto) {
    const data = await this.outletsService.update(+id, updateOutletDto);
    return {
      message: 'Outlet updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an outlet (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Outlet deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Outlet not found' })
  async remove(@Param('id') id: string) {
    await this.outletsService.remove(+id);
    return {
      message: 'Outlet deleted successfully',
      data: null,
    };
  }
}
