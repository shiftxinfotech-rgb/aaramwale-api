import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new customer' })
  @SwaggerApiResponse({ status: 201, description: 'Customer created successfully', type: CustomerResponseDto })
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    const data = await this.customersService.create(createCustomerDto);
    return {
      message: 'Customer created successfully',
      data,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all customers' })
  @SwaggerApiResponse({ status: 200, description: 'List of all customers', type: [CustomerResponseDto] })
  async findAll() {
    const data = await this.customersService.findAll();
    return {
      message: 'Customers retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get customer by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Customer details', type: CustomerResponseDto })
  @SwaggerApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.customersService.findOne(+id);
    return {
      message: 'Customer retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update customer details (Admin only)' })
  @SwaggerApiResponse({ status: 200, description: 'Customer updated successfully', type: CustomerResponseDto })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Customer not found' })
  async update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    const data = await this.customersService.update(+id, updateCustomerDto);
    return {
      message: 'Customer updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a customer (Admin only)' })
  @SwaggerApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Customer not found' })
  async remove(@Param('id') id: string) {
    await this.customersService.remove(+id);
    return {
      message: 'Customer deleted successfully',
      data: null,
    };
  }
}
