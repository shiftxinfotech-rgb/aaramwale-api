import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new admin (Admin only)' })
    @SwaggerApiResponse({ status: 201, description: 'Admin created successfully' })
    @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
    async create(@Body() createAdminDto: CreateAdminDto) {
        const data = await this.adminService.create(createAdminDto);
        return {
            message: 'Admin created successfully',
            data,
        };
    }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all admins (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'List of all admins' })
    async findAll() {
        const data = await this.adminService.findAll();
        return {
            message: 'Admins retrieved successfully',
            data,
        };
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get an admin by ID (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Admin details' })
    @SwaggerApiResponse({ status: 404, description: 'Admin not found' })
    async findOne(@Param('id') id: string) {
        const data = await this.adminService.findOne(+id);
        return {
            message: 'Admin retrieved successfully',
            data,
        };
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update an admin (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Admin updated successfully' })
    @SwaggerApiResponse({ status: 404, description: 'Admin not found' })
    async update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
        const data = await this.adminService.update(+id, updateAdminDto);
        return {
            message: 'Admin updated successfully',
            data,
        };
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete an admin (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Admin deleted successfully' })
    @SwaggerApiResponse({ status: 404, description: 'Admin not found' })
    async remove(@Param('id') id: string) {
        await this.adminService.remove(+id);
        return {
            message: 'Admin deleted successfully',
            data: null,
        };
    }
}
