import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  outletId: number;

  @ApiProperty({ example: 1 })
  chairId: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 50.0 })
  amount: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: '2026-02-13T14:35:53Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-13T14:35:53Z' })
  updatedAt: Date;
}
