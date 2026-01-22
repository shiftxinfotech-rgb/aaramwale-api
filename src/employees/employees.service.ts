import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ApiResponse } from '../common/dto/api-response.dto';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async create(createEmployeeDto: CreateEmployeeDto): Promise<ApiResponse<User>> {
        const { email, password, ...rest } = createEmployeeDto;

        const existingUser = await this.userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new BadRequestException('Employee with this email already exists');
        }

        const employee = this.userRepository.create({
            ...rest,
            email,
            password,
            role: UserRole.EMPLOYEE,
        });

        const savedEmployee = await this.userRepository.save(employee);
        // Remove password from response
        const { password: _, ...result } = savedEmployee;

        return ApiResponse.success(result as User, 'Employee created successfully', 201);
    }

    async findAll(): Promise<ApiResponse<User[]>> {
        const employees = await this.userRepository.find({
            where: { role: UserRole.EMPLOYEE },
            relations: ['outlet'],
            order: { createdAt: 'DESC' },
        });
        return ApiResponse.success(employees, 'Employees retrieved successfully');
    }

    async findByOutlet(outletId: number): Promise<ApiResponse<User[]>> {
        const employees = await this.userRepository.find({
            where: { outletId, role: UserRole.EMPLOYEE },
            relations: ['outlet'],
            order: { createdAt: 'DESC' },
        });
        return ApiResponse.success(employees, 'Employees for outlet retrieved successfully');
    }

    async findOne(id: number): Promise<ApiResponse<User>> {
        const employee = await this.userRepository.findOne({
            where: { id, role: UserRole.EMPLOYEE },
            relations: ['outlet'],
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        return ApiResponse.success(employee, 'Employee retrieved successfully');
    }

    async update(id: number, updateEmployeeDto: UpdateEmployeeDto): Promise<ApiResponse<User>> {
        const employee = await this.userRepository.findOne({
            where: { id, role: UserRole.EMPLOYEE },
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        Object.assign(employee, updateEmployeeDto);
        const updatedEmployee = await this.userRepository.save(employee);

        // Reload with relations
        const fullEmployee = await this.userRepository.findOne({
            where: { id },
            relations: ['outlet']
        });

        if (!fullEmployee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        return ApiResponse.success(fullEmployee, 'Employee updated successfully');
    }

    async remove(id: number): Promise<ApiResponse<null>> {
        const employee = await this.userRepository.findOne({
            where: { id, role: UserRole.EMPLOYEE },
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        await this.userRepository.remove(employee);
        return ApiResponse.success(null, 'Employee deleted successfully');
    }
}
