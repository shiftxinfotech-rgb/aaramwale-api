import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { User } from '../users/user.entity';
import { Attendance } from '../attendance/attendance.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Attendance])],
    controllers: [EmployeesController],
    providers: [EmployeesService],
    exports: [EmployeesService],
})
export class EmployeesModule { }
