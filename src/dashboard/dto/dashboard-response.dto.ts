import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DashboardResponseDto {
  @ApiProperty({ example: 2500 })
  todayRevenue: number;

  @ApiProperty({ example: 15 })
  todayPassSales: number;

  @ApiProperty({ example: 8 })
  todayWalkIns: number;

  @ApiProperty({ example: 22 })
  todayRedemptions: number;

  @ApiProperty({ example: 120 })
  activeCustomers: number;

  @ApiProperty({ example: 45000 })
  monthlyRevenue: number;

  @ApiPropertyOptional({
    example: {
      CASH: { count: 10, revenue: 1500 },
      UPI: { count: 5, revenue: 1000 },
    },
  })
  todaySalesByPaymentMethod?: Record<
    string,
    { count: number; revenue: number }
  >;
}
