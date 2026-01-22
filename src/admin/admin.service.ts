import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ApiResponse } from '../common/dto/api-response.dto';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async create(createAdminDto: CreateAdminDto): Promise<ApiResponse<User>> {
        const { email, password, ...rest } = createAdminDto;

        const existingUser = await this.userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const admin = this.userRepository.create({
            ...rest,
            email,
            password,
            role: UserRole.ADMIN,
        });

        const savedAdmin = await this.userRepository.save(admin);
        const { password: _, ...result } = savedAdmin;

        return ApiResponse.success(result as User, 'Admin created successfully', 201);
    }

    async findAll(): Promise<ApiResponse<User[]>> {
        const admins = await this.userRepository.find({
            where: { role: UserRole.ADMIN },
            order: { createdAt: 'DESC' },
        });
        return ApiResponse.success(admins, 'Admins retrieved successfully');
    }

    async findOne(id: number): Promise<ApiResponse<User>> {
        const admin = await this.userRepository.findOne({
            where: { id, role: UserRole.ADMIN },
        });

        if (!admin) {
            throw new NotFoundException(`Admin with ID ${id} not found`);
        }

        return ApiResponse.success(admin, 'Admin retrieved successfully');
    }

    async update(id: number, updateAdminDto: UpdateAdminDto): Promise<ApiResponse<User>> {
        const admin = await this.userRepository.findOne({
            where: { id, role: UserRole.ADMIN },
        });

        if (!admin) {
            throw new NotFoundException(`Admin with ID ${id} not found`);
        }

        Object.assign(admin, updateAdminDto);
        await this.userRepository.save(admin);

        const updatedAdmin = await this.userRepository.findOne({ where: { id } });
        if (!updatedAdmin) {
            throw new NotFoundException(`Admin with ID ${id} not found`);
        }

        return ApiResponse.success(updatedAdmin, 'Admin updated successfully');
    }

    async remove(id: number): Promise<ApiResponse<null>> {
        const admin = await this.userRepository.findOne({
            where: { id, role: UserRole.ADMIN },
        });

        if (!admin) {
            throw new NotFoundException(`Admin with ID ${id} not found`);
        }

        await this.userRepository.remove(admin);
        return ApiResponse.success(null, 'Admin deleted successfully');
    }
}
