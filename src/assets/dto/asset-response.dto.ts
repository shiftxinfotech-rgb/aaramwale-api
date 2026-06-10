import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { OutletResponseDto } from '../../outlets/dto/outlet-response.dto';

export class AssetResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  categoryId: number;

  @ApiProperty({ example: 1 })
  outletId: number;

  @ApiProperty({ example: 'MC-001' })
  assetCode: string;

  @ApiProperty({ example: 'Massage Chair 1' })
  assetName: string;

  @ApiProperty({ example: 100.00 })
  unitPrice: number;

  @ApiProperty({ example: 15 })
  durationMinutes: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: () => CategoryResponseDto, required: false })
  category?: CategoryResponseDto;

  @ApiProperty({ type: () => OutletResponseDto, required: false })
  outlet?: OutletResponseDto;

  @ApiProperty({ example: '2026-06-02T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-02T12:00:00.000Z' })
  updatedAt: Date;
}
