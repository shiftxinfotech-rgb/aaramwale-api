import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class WalkInSessionListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by outlet ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  outletId?: number;

  @ApiPropertyOptional({ example: 12, description: "Filter by customer ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;

  @ApiPropertyOptional({ example: 5, description: "Filter by asset ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  assetId?: number;

  @ApiPropertyOptional({ example: 7, description: "Filter by employee ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  employeeId?: number;

  @ApiPropertyOptional({
    example: "2026-06-09",
    description: "Filter by exact session date (YYYY-MM-DD)",
  })
  @IsOptional()
  @IsString()
  sessionDate?: string;

  @ApiPropertyOptional({
    example: "2026-06-01",
    description: "Filter sessions on or after this date (YYYY-MM-DD)",
  })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: "2026-06-30",
    description: "Filter sessions on or before this date (YYYY-MM-DD)",
  })
  @IsOptional()
  @IsString()
  toDate?: string;
}
