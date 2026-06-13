import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";

export class ReportQueryDto {
  @ApiPropertyOptional({
    example: "2026-06-01",
    description: "Filter reports starting from this date",
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: "2026-06-30",
    description: "Filter reports up to this date",
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
