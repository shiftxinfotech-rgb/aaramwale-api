import { ApiProperty } from "@nestjs/swagger";

export class PassStatsResponseDto {
  @ApiProperty({ example: 10 })
  totalPasses: number;

  @ApiProperty({ example: 4 })
  activePasses: number;

  @ApiProperty({ example: 5 })
  completedPasses: number;

  @ApiProperty({ example: 1 })
  cancelledPasses: number;

  @ApiProperty({ example: 1000.0 })
  totalRevenue: number;

  @ApiProperty({ example: 600.0, required: false })
  passRevenue?: number;

  @ApiProperty({ example: 400.0, required: false })
  walkInRevenue?: number;

  @ApiProperty({ example: 8, required: false })
  todayRedemptions?: number;

  @ApiProperty({ example: 2, required: false })
  freeSessionsUsed?: number;

  @ApiProperty({ example: "2026-06-02" })
  date: string;
}
