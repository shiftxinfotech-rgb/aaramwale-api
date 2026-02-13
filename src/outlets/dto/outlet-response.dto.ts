import { ApiProperty } from '@nestjs/swagger';

export class OutletResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Downtown Branch' })
    name: string;

    @ApiProperty({ example: '123 Main Street, Floor 2' })
    address: string;

    @ApiProperty({ example: 'Mumbai' })
    city: string;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiProperty({ example: '2026-02-13T14:28:21Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-02-13T14:28:21Z' })
    updatedAt: Date;
}
