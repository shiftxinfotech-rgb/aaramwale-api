import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from './attendance.entity';
import { User } from '../users/user.entity';

@Injectable()
export class AttendanceService {
    constructor(
        @InjectRepository(Attendance)
        private attendanceRepository: Repository<Attendance>,
    ) { }

    async clockIn(user: User, outletId: number): Promise<Attendance> {
        // Check if already clocked in today (or currently active)
        const today = new Date().toISOString().split('T')[0];

        // If outletId is 0 or undefined, we'll rely on user.outletId later
        const finalOutletId = outletId || user.outletId;

        const existingSession = await this.attendanceRepository.findOne({
            where: {
                userId: user.id,
                status: 'PRESENT'
            }
        });

        if (existingSession) {
            throw new BadRequestException('You are already clocked in.');
        }

        const attendance = this.attendanceRepository.create({
            userId: user.id,
            outletId: finalOutletId,
            date: today,
            clockIn: new Date(),
            status: 'PRESENT'
        });

        return this.attendanceRepository.save(attendance);
    }

    async clockOut(user: User): Promise<Attendance> {
        const session = await this.attendanceRepository.findOne({
            where: {
                userId: user.id,
                status: 'PRESENT'
            }
        });

        if (!session) {
            throw new BadRequestException('You are not clocked in.');
        }

        const now = new Date();
        const durationMs = now.getTime() - new Date(session.clockIn).getTime();
        const durationHours = durationMs / (1000 * 60 * 60);

        session.clockOut = now;
        session.durationHours = parseFloat(durationHours.toFixed(2));
        session.status = 'COMPLETED';

        return this.attendanceRepository.save(session);
    }

    async getStatus(userId: number): Promise<{ isClockedIn: boolean, session: Attendance | null }> {
        const session = await this.attendanceRepository.findOne({
            where: {
                userId,
                status: 'PRESENT'
            },
            relations: ['outlet']
        });

        return {
            isClockedIn: !!session,
            session
        };
    }

    async getHistory(userId: number, days: number = 7): Promise<Attendance[]> {
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - days);

        return this.attendanceRepository.find({
            where: {
                userId,
                clockIn: Between(pastDate, today) // Simple range logic, can be refined
            },
            order: {
                createdAt: 'DESC'
            },
            relations: ['outlet']
        });
    }
}
