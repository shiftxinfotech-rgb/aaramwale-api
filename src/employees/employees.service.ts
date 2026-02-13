import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Attendance } from '../attendance/attendance.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Attendance)
        private attendanceRepository: Repository<Attendance>,
    ) { }

    // Helper: attach attendance status to employees
    private async attachAttendanceStatus(employees: User[]): Promise<any[]> {
        const employeeIds = employees.map(e => e.id);

        // Get all active attendance sessions for these employees in one query
        const activeSessions = await this.attendanceRepository.find({
            where: employeeIds.map(id => ({ userId: id, status: 'PRESENT' })),
        });

        // Create a map for quick lookup
        const sessionMap = new Map<number, Attendance>();
        for (const session of activeSessions) {
            sessionMap.set(session.userId, session);
        }

        return employees.map(employee => {
            const session = sessionMap.get(employee.id);
            return {
                ...employee,
                isClockedIn: !!session,
                lastClockIn: session ? session.clockIn : null,
            };
        });
    }

    async create(createEmployeeDto: CreateEmployeeDto): Promise<User> {
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

        return result as User;
    }

    async findAll(): Promise<any[]> {
        const employees = await this.userRepository.find({
            where: { role: UserRole.EMPLOYEE },
            relations: ['outlet'],
            order: { createdAt: 'DESC' },
        });

        return this.attachAttendanceStatus(employees);
    }

    async findByOutlet(outletId: number): Promise<any[]> {
        const employees = await this.userRepository.find({
            where: { outletId, role: UserRole.EMPLOYEE },
            relations: ['outlet'],
            order: { createdAt: 'DESC' },
        });

        return this.attachAttendanceStatus(employees);
    }

    async findOne(id: number): Promise<any> {
        const employee = await this.userRepository.findOne({
            where: { id, role: UserRole.EMPLOYEE },
            relations: ['outlet'],
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        const [enriched] = await this.attachAttendanceStatus([employee]);
        return enriched;
    }

    async update(id: number, updateEmployeeDto: UpdateEmployeeDto): Promise<any> {
        const employee = await this.userRepository.findOne({
            where: { id, role: UserRole.EMPLOYEE },
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        Object.assign(employee, updateEmployeeDto);
        await this.userRepository.save(employee);

        // Reload with relations
        const fullEmployee = await this.userRepository.findOne({
            where: { id },
            relations: ['outlet']
        });

        if (!fullEmployee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        const [enriched] = await this.attachAttendanceStatus([fullEmployee]);
        return enriched;
    }

    async remove(id: number): Promise<void> {
        const employee = await this.userRepository.findOne({
            where: { id, role: UserRole.EMPLOYEE },
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        await this.userRepository.remove(employee);
    }
}
