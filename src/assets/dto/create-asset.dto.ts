import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ example: 1, description: 'Category ID of the asset' })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ example: 1, description: 'Outlet ID where the asset is located' })
  @IsNumber()
  @IsNotEmpty()
  outletId: number;

  @ApiProperty({ example: 'MC-001', description: 'Unique asset code / identifier' })
  @IsString()
  @IsNotEmpty()
  assetCode: string;

  @ApiProperty({ example: 'Massage Chair 1', description: 'Display name of the asset' })
  @IsString()
  @IsNotEmpty()
  assetName: string;

  @ApiProperty({ example: 100.00, description: 'Unit price charged per session/use' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  unitPrice: number;

  @ApiProperty({ example: 15, description: 'Duration of rent in minutes' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  durationMinutes: number;

  @ApiPropertyOptional({ example: true, description: 'Is the asset active for rentals' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
