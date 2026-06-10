import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsIn } from 'class-validator';

export class CreateWalkInSessionDto {
  @ApiProperty({ example: 12, description: 'Customer ID' })
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty({ example: 1, description: 'Outlet ID' })
  @IsNumber()
  @IsNotEmpty()
  outletId: number;

  @ApiProperty({ example: 5, description: 'Asset ID' })
  @IsNumber()
  @IsNotEmpty()
  assetId: number;

  @ApiProperty({ example: 1, description: 'Quantity of sessions' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({ example: 'NONE', enum: ['NONE', 'PERCENTAGE', 'FIXED'] })
  @IsString()
  @IsIn(['NONE', 'PERCENTAGE', 'FIXED'])
  @IsOptional()
  discountType?: string;

  @ApiPropertyOptional({ example: 0, description: 'Discount value (percentage rate or fixed amount)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @ApiPropertyOptional({ example: 'Customer walk-in', description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ example: '2026-06-09', description: 'Session Date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  sessionDate?: string;
}
