import { ApiProperty } from '@nestjs/swagger';

export class ChairResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'C-001' })
  chairNumber: string;

  @ApiProperty({ example: 100 })
  rentPerToken: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1 })
  outletId: number;

  @ApiProperty({ example: '2026-02-13T14:35:53Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-13T14:35:53Z' })
  updatedAt: Date;
}
