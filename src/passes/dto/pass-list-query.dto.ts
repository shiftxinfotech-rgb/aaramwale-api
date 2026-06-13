import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class PassListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by outlet ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  outletId?: number;

  @ApiPropertyOptional({
    example: "ACTIVE",
    enum: ["ACTIVE", "PARTIALLY_REDEEMED", "FULLY_REDEEMED", "CANCELLED"],
  })
  @IsOptional()
  @IsIn(["ACTIVE", "PARTIALLY_REDEEMED", "FULLY_REDEEMED", "CANCELLED"])
  status?: string;

  @ApiPropertyOptional({
    example: 5,
    description: "Filter by asset ID (searches pass items)",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  assetId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: "Filter by category ID (searches pass items)",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ example: 12, description: "Filter by customer ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customerId?: number;

  @ApiPropertyOptional({
    example: 7,
    description: "Filter by employee/user ID",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  employeeId?: number;

  @ApiPropertyOptional({
    example: "8089329348",
    description: "Filter by customer mobile number",
  })
  @IsOptional()
  @IsString()
  customerMobile?: string;

  @ApiPropertyOptional({
    example: "jane",
    description: "Filter by customer name",
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    example: "2026-06-01",
    description: "Filter passes created on or after this date",
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: "2026-06-30",
    description: "Filter passes created on or before this date",
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
