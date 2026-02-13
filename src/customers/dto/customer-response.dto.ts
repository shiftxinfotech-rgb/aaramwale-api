import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'John Smith' })
    name: string;

    @ApiProperty({ example: '9876543210' })
    phoneNumber: string;

    @ApiProperty({ example: 'john.smith@example.com' })
    email: string;

    @ApiProperty({ example: '2026-02-13T14:35:53Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-02-13T14:35:53Z' })
    updatedAt: Date;
}
