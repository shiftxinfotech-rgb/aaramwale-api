import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChairsService } from './chairs.service';
import { CreateChairDto } from './dto/create-chair.dto';
import { UpdateChairDto } from './dto/update-chair.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Chairs')
@ApiBearerAuth()
@Controller('chairs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChairsController {
  constructor(private readonly chairsService: ChairsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new chair (Admin only)' })
  @ApiResponse({ status: 201, description: 'Chair created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createChairDto: CreateChairDto) {
    return this.chairsService.create(createChairDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all chairs' })
  @ApiResponse({ status: 200, description: 'List of all chairs' })
  findAll() {
    return this.chairsService.findAll();
  }

  @Get('outlet/:outletId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all chairs by outlet' })
  @ApiResponse({ status: 200, description: 'List of chairs for outlet' })
  findByOutlet(@Param('outletId') outletId: string) {
    return this.chairsService.findByOutlet(+outletId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get a chair by ID' })
  @ApiResponse({ status: 200, description: 'Chair details' })
  @ApiResponse({ status: 404, description: 'Chair not found' })
  findOne(@Param('id') id: string) {
    return this.chairsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a chair (Admin only)' })
  @ApiResponse({ status: 200, description: 'Chair updated successfully' })
  @ApiResponse({ status: 404, description: 'Chair not found' })
  update(@Param('id') id: string, @Body() updateChairDto: UpdateChairDto) {
    return this.chairsService.update(+id, updateChairDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a chair (Admin only)' })
  @ApiResponse({ status: 200, description: 'Chair deleted successfully' })
  @ApiResponse({ status: 404, description: 'Chair not found' })
  remove(@Param('id') id: string) {
    return this.chairsService.remove(+id);
  }
}
