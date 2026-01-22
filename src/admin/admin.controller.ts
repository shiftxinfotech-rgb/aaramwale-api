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
    create(@Body() createAdminDto: CreateAdminDto) {
        return this.adminService.create(createAdminDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all admins (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'List of all admins' })
    findAll() {
        return this.adminService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get an admin by ID (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Admin details' })
    @SwaggerApiResponse({ status: 404, description: 'Admin not found' })
    findOne(@Param('id') id: string) {
        return this.adminService.findOne(+id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update an admin (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Admin updated successfully' })
    @SwaggerApiResponse({ status: 404, description: 'Admin not found' })
    update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
        return this.adminService.update(+id, updateAdminDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete an admin (Admin only)' })
    @SwaggerApiResponse({ status: 200, description: 'Admin deleted successfully' })
    @SwaggerApiResponse({ status: 404, description: 'Admin not found' })
    remove(@Param('id') id: string) {
        return this.adminService.remove(+id);
    }
}
