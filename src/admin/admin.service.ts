import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async create(createAdminDto: CreateAdminDto): Promise<User> {
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

        return result as User;
    }

    async findAll(): Promise<User[]> {
        return await this.userRepository.find({
            where: { role: UserRole.ADMIN },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number): Promise<User> {
        const admin = await this.userRepository.findOne({
            where: { id, role: UserRole.ADMIN },
        });

        if (!admin) {
            throw new NotFoundException(`Admin with ID ${id} not found`);
        }

        return admin;
    }

    async update(id: number, updateAdminDto: UpdateAdminDto): Promise<User> {
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

        return updatedAdmin;
    }

    async remove(id: number): Promise<void> {
        const admin = await this.userRepository.findOne({
            where: { id, role: UserRole.ADMIN },
        });

        if (!admin) {
            throw new NotFoundException(`Admin with ID ${id} not found`);
        }

        await this.userRepository.remove(admin);
    }
}
