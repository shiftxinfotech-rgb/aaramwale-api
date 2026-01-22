import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new employee (Admin only)' })
    @SwaggerApiResponse({ status: 201, description: 'Employee created successfully' })
    @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
    create(@Body() createEmployeeDto: CreateEmployeeDto) {
        return this.employeesService.create(createEmployeeDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all employees (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'List of all employees' })
    findAll() {
        return this.employeesService.findAll();
    }

    @Get('outlet/:outletId')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all employees by outlet (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'List of employees for outlet' })
    findByOutlet(@Param('outletId') outletId: string) {
        return this.employeesService.findByOutlet(+outletId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get an employee by ID (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Employee details' })
    @SwaggerApiResponse({ status: 404, description: 'Employee not found' })
    findOne(@Param('id') id: string) {
        return this.employeesService.findOne(+id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update an employee (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Employee updated successfully' })
    @SwaggerApiResponse({ status: 404, description: 'Employee not found' })
    update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
        return this.employeesService.update(+id, updateEmployeeDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete an employee (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Employee deleted successfully' })
    @SwaggerApiResponse({ status: 404, description: 'Employee not found' })
    remove(@Param('id') id: string) {
        return this.employeesService.remove(+id);
    }
}
