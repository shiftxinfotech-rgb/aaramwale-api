import { ApiProperty } from '@nestjs/swagger';

export class AttendanceResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 1 })
    userId: number;

    @ApiProperty({ example: 1 })
    outletId: number;

    @ApiProperty({ example: '2026-02-13' })
    date: string;

    @ApiProperty({ example: '2026-02-13T09:00:00Z' })
    clockIn: Date;

    @ApiProperty({ example: '2026-02-13T17:00:00Z', nullable: true })
    clockOut: Date;

    @ApiProperty({ example: 8.0, nullable: true })
    durationHours: number;

    @ApiProperty({ example: 'PRESENT' })
    status: string;

    @ApiProperty({ example: '2026-02-13T09:00:00Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-02-13T09:00:00Z' })
    updatedAt: Date;
}
