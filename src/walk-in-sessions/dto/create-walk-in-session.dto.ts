import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsIn,
} from "class-validator";

export class CreateWalkInSessionDto {
  @ApiProperty({ example: 12, description: "Customer ID" })
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty({ example: 1, description: "Outlet ID" })
  @IsNumber()
  @IsNotEmpty()
  outletId: number;

  @ApiProperty({ example: 5, description: "Asset ID" })
  @IsNumber()
  @IsNotEmpty()
  assetId: number;

  @ApiProperty({ example: 1, description: "Quantity of sessions" })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({
    example: "NONE",
    enum: ["NONE", "PERCENTAGE", "FIXED"],
  })
  @IsString()
  @IsIn(["NONE", "PERCENTAGE", "FIXED"])
  @IsOptional()
  discountType?: string;

  @ApiPropertyOptional({
    example: 0,
    description: "Discount value (percentage rate or fixed amount)",
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @ApiPropertyOptional({ example: "Customer walk-in", description: "Remarks" })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({
    example: "2026-06-09",
    description: "Session Date (YYYY-MM-DD)",
  })
  @IsString()
  @IsOptional()
  sessionDate?: string;

  @ApiPropertyOptional({
    example: "CASH",
    enum: ["CASH", "UPI", "CARD", "BANK_TRANSFER", "MIXED"],
  })
  @IsString()
  @IsIn(["CASH", "UPI", "CARD", "BANK_TRANSFER", "MIXED"])
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 100.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;

  @ApiPropertyOptional({
    example: "PAID",
    enum: ["PAID", "PARTIAL", "PENDING", "REFUNDED"],
  })
  @IsString()
  @IsIn(["PAID", "PARTIAL", "PENDING", "REFUNDED"])
  @IsOptional()
  paymentStatus?: string;

  @ApiPropertyOptional({ example: "2026-06-09T12:00:00.000Z" })
  @IsString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  receivedByUserId?: number;
}
