import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { EmployeeListQueryDto } from './dto/employee-list-query.dto';
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
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new employee (Super Admin only)' })
    @SwaggerApiResponse({ status: 201, description: 'Employee created successfully', type: EmployeeResponseDto })
    @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
    async create(@Body() createEmployeeDto: CreateEmployeeDto) {
        const data = await this.employeesService.create(createEmployeeDto);
        return {
            message: 'Employee created successfully',
            data,
        };
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all employees with pagination, search, status filter, and sorting (Super Admin / Admin)' })
    @SwaggerApiResponse({ status: 200, description: 'Paginated list of all employees' })
    async findAll(@Query() query: EmployeeListQueryDto) {
        const data = await this.employeesService.findAll(query);
        return {
            message: 'Employees retrieved successfully',
            data,
        };
    }

    @Get('outlet/:outletId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all employees by outlet (Super Admin / Admin)' })
    @SwaggerApiResponse({ status: 200, description: 'List of employees for outlet', type: [EmployeeResponseDto] })
    async findByOutlet(@Param('outletId') outletId: string) {
        const data = await this.employeesService.findByOutlet(+outletId);
        return {
            message: 'Employees for outlet retrieved successfully',
            data,
        };
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get an employee by ID (Super Admin / Admin)' })
    @SwaggerApiResponse({ status: 200, description: 'Employee details', type: EmployeeResponseDto })
    @SwaggerApiResponse({ status: 404, description: 'Employee not found' })
    async findOne(@Param('id') id: string) {
        const data = await this.employeesService.findOne(+id);
        return {
            message: 'Employee retrieved successfully',
            data,
        };
    }

    @Patch(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update an employee (Super Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Employee updated successfully', type: EmployeeResponseDto })
    @SwaggerApiResponse({ status: 404, description: 'Employee not found' })
    async update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
        const data = await this.employeesService.update(+id, updateEmployeeDto);
        return {
            message: 'Employee updated successfully',
            data,
        };
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete an employee (Super Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Employee deleted successfully' })
    @SwaggerApiResponse({ status: 404, description: 'Employee not found' })
    async remove(@Param('id') id: string) {
        await this.employeesService.remove(+id);
        return {
            message: 'Employee deleted successfully',
            data: null,
        };
    }
}
