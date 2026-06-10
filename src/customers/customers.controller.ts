import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerListQueryDto } from './dto/customer-list-query.dto';
import { CustomerProfileResponseDto } from './dto/customer-profile-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new customer' })
  @SwaggerApiResponse({ status: 201, description: 'Customer created successfully', type: CustomerResponseDto })
  async create(@Body() createCustomerDto: CreateCustomerDto, @GetUser() user: any) {
    if (user.role === UserRole.EMPLOYEE && !createCustomerDto.outletId) {
      createCustomerDto.outletId = user.outletId;
    }
    const data = await this.customersService.create(createCustomerDto);
    return {
      message: 'Customer created successfully',
      data,
    };
  }

  @Get('search')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Fast customer search by name or mobile (optimized for mobile app)' })
  @ApiQuery({ name: 'q', required: true, description: 'Name or mobile number to search' })
  @SwaggerApiResponse({ status: 200, description: 'Matching customers' })
  async search(@Query('q') q: string, @GetUser() user: any) {
    const filterOutletId = user.role === UserRole.EMPLOYEE ? user.outletId : undefined;
    const data = await this.customersService.search(q, filterOutletId);
    return {
      message: 'Customer search results',
      data,
    };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all customers with pagination, search, filters, and sorting' })
  @SwaggerApiResponse({ status: 200, description: 'Paginated list of all customers' })
  async findAll(@Query() query: CustomerListQueryDto, @GetUser() user: any) {
    const filterOutletId = user.role === UserRole.EMPLOYEE ? user.outletId : undefined;
    const data = await this.customersService.findAll(query, filterOutletId);
    return {
      message: 'Customers retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get customer profile details by ID' })
  @SwaggerApiResponse({ status: 200, description: 'Customer profile details', type: CustomerProfileResponseDto })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden. Current employee cannot access customers outside their tenant' })
  @SwaggerApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id') id: string, @GetUser() user: any) {
    const data = await this.customersService.findOneProfile(+id, user);
    return {
      message: 'Customer retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
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
