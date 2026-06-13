import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Min,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";

export class PassItemInputDto {
  @ApiProperty({ example: 1, description: "Asset ID" })
  @IsNumber()
  @IsNotEmpty()
  assetId: number;

  @ApiProperty({ example: 5, description: "Paid quantity" })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  paidQuantity: number;

  @ApiPropertyOptional({ example: 2, description: "Free quantity" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  freeQuantity?: number;
}

export class CreatePassDto {
  @ApiProperty({ example: 12, description: "Customer ID" })
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @ApiPropertyOptional({
    example: "PERCENTAGE",
    enum: ["NONE", "PERCENTAGE", "FIXED"],
  })
  @IsString()
  @IsIn(["NONE", "PERCENTAGE", "FIXED"])
  @IsOptional()
  discountType?: "NONE" | "PERCENTAGE" | "FIXED";

  @ApiPropertyOptional({
    example: 10,
    description: "Discount value (percentage rate or fixed amount)",
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @ApiProperty({ type: [PassItemInputDto], description: "Items in the pass" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassItemInputDto)
  @IsNotEmpty()
  items: PassItemInputDto[];
}
