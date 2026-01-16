import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OutletsService } from './outlets.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Outlets')
@ApiBearerAuth()
@Controller('outlets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new outlet (Admin only)' })
  @ApiResponse({ status: 201, description: 'Outlet created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createOutletDto: CreateOutletDto) {
    return this.outletsService.create(createOutletDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all outlets' })
  @ApiResponse({ status: 200, description: 'List of all outlets' })
  findAll() {
    return this.outletsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get an outlet by ID' })
  @ApiResponse({ status: 200, description: 'Outlet details' })
  @ApiResponse({ status: 404, description: 'Outlet not found' })
  findOne(@Param('id') id: string) {
    return this.outletsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an outlet (Admin only)' })
  @ApiResponse({ status: 200, description: 'Outlet updated successfully' })
  @ApiResponse({ status: 404, description: 'Outlet not found' })
  update(@Param('id') id: string, @Body() updateOutletDto: UpdateOutletDto) {
    return this.outletsService.update(+id, updateOutletDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an outlet (Admin only)' })
  @ApiResponse({ status: 200, description: 'Outlet deleted successfully' })
  @ApiResponse({ status: 404, description: 'Outlet not found' })
  remove(@Param('id') id: string) {
    return this.outletsService.remove(+id);
  }
}
