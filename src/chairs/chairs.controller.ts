import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChairsService } from './chairs.service';
import { CreateChairDto } from './dto/create-chair.dto';
import { UpdateChairDto } from './dto/update-chair.dto';
import { ChairResponseDto } from './dto/chair-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Chairs')
@ApiBearerAuth()
@Controller('chairs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChairsController {
  constructor(private readonly chairsService: ChairsService) { }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new chair (Admin only)' })
  @ApiResponse({ status: 201, description: 'Chair created successfully', type: ChairResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createChairDto: CreateChairDto) {
    const data = await this.chairsService.create(createChairDto);
    return {
      message: 'Chair created successfully',
      data,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all chairs' })
  @ApiResponse({ status: 200, description: 'List of all chairs', type: [ChairResponseDto] })
  async findAll() {
    const data = await this.chairsService.findAll();
    return {
      message: 'Chairs retrieved successfully',
      data,
    };
  }

  @Get('outlet/:outletId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all chairs by outlet' })
  @ApiResponse({ status: 200, description: 'List of chairs for outlet', type: [ChairResponseDto] })
  async findByOutlet(@Param('outletId') outletId: string) {
    const data = await this.chairsService.findByOutlet(+outletId);
    return {
      message: 'Chairs for outlet retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get a chair by ID' })
  @ApiResponse({ status: 200, description: 'Chair details', type: ChairResponseDto })
  @ApiResponse({ status: 404, description: 'Chair not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.chairsService.findOne(+id);
    return {
      message: 'Chair retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a chair (Admin only)' })
  @ApiResponse({ status: 200, description: 'Chair updated successfully', type: ChairResponseDto })
  @ApiResponse({ status: 404, description: 'Chair not found' })
  async update(@Param('id') id: string, @Body() updateChairDto: UpdateChairDto) {
    const data = await this.chairsService.update(+id, updateChairDto);
    return {
      message: 'Chair updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a chair (Admin only)' })
  @ApiResponse({ status: 200, description: 'Chair deleted successfully' })
  @ApiResponse({ status: 404, description: 'Chair not found' })
  async remove(@Param('id') id: string) {
    await this.chairsService.remove(+id);
    return {
      message: 'Chair deleted successfully',
      data: null,
    };
  }
}
