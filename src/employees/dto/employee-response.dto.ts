import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class EmployeeResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'employee_one' })
    username: string;

    @ApiProperty({ example: 'John Doe' })
    fullName: string;

    @ApiProperty({ example: 'john@example.com' })
    email: string;

    @ApiProperty({ example: '1234567890' })
    phoneNumber: string;

    @ApiProperty({ example: UserRole.EMPLOYEE, enum: UserRole })
    role: UserRole;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiProperty({ example: 1 })
    outletId: number;

    @ApiProperty({ example: true, description: 'Whether the employee is currently clocked in' })
    isClockedIn: boolean;

    @ApiProperty({ example: '2026-02-13T09:00:00Z', nullable: true, description: 'Last clock-in time if currently working' })
    lastClockIn: Date;

    @ApiProperty({ example: '2026-02-13T14:35:53Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-02-13T14:35:53Z' })
    updatedAt: Date;
}
