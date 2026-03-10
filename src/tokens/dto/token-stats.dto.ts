import { ApiProperty } from '@nestjs/swagger';

export class TokenStatsDto {
  @ApiProperty({ example: 12 })
  totalTokens: number;

  @ApiProperty({ example: 8 })
  activeTokens: number;

  @ApiProperty({ example: 4 })
  completedTokens: number;

  @ApiProperty({ example: 600 })
  totalRevenue: number;

  @ApiProperty({ example: '2026-03-10' })
  date: string;
}
