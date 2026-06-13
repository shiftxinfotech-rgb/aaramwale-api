import { ApiProperty } from "@nestjs/swagger";

export class AssetWiseReportDto {
  @ApiProperty({ example: 5 })
  assetId: number;

  @ApiProperty({ example: "MC-001" })
  assetCode: string;

  @ApiProperty({ example: "Massage Chair 1" })
  assetName: string;

  @ApiProperty({ example: 8 })
  totalPasses: number;

  @ApiProperty({ example: 800.0 })
  totalRevenue: number;
}
