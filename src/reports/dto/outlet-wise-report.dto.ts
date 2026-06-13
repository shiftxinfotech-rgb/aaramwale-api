import { ApiProperty } from "@nestjs/swagger";

export class OutletWiseReportDto {
  @ApiProperty({ example: 1 })
  outletId: number;

  @ApiProperty({ example: "AaramWale Ahmedabad" })
  outletName: string;

  @ApiProperty({ example: 20 })
  totalPasses: number;

  @ApiProperty({ example: 2000.0 })
  totalRevenue: number;
}
