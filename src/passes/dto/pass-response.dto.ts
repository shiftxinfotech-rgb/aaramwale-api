import { ApiProperty } from '@nestjs/swagger';
import { PassCustomerDto, PassCategoryDto, PassAssetDto, PassEmployeeDto } from './pass-response-helper.dto';

export class PassItemResponseDto {
  @ApiProperty({ example: 101 })
  passItemId: number;

  @ApiProperty({ example: 3 })
  categoryId: number;

  @ApiProperty({ example: 'Foot Kasa Massager' })
  categoryName: string;

  @ApiProperty({ example: 5 })
  assetId: number;

  @ApiProperty({ example: 'Kasa Massager Pro 1' })
  assetName: string;

  @ApiProperty({ example: 2 })
  paidQuantity: number;

  @ApiProperty({ example: 1 })
  freeQuantity: number;

  @ApiProperty({ example: 3 })
  totalQuantity: number;

  @ApiProperty({ example: 0 })
  redeemedQuantity: number;

  @ApiProperty({ example: 3 })
  remainingQuantity: number;

  @ApiProperty({ example: 80.00 })
  unitPrice: number;

  @ApiProperty({ example: 80.00 })
  lineTotal: number;

  @ApiProperty({ type: PassCategoryDto, required: false })
  category?: PassCategoryDto;

  @ApiProperty({ type: PassAssetDto, required: false })
  asset?: PassAssetDto;
}

export class PassResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'AW202606020001' })
  passNumber: string;

  @ApiProperty({ type: PassCustomerDto })
  customer: PassCustomerDto;

  @ApiProperty({ type: [PassItemResponseDto] })
  items: PassItemResponseDto[];

  @ApiProperty({ example: 100.00 })
  subtotalAmount: number;

  @ApiProperty({ example: 'PERCENTAGE', enum: ['NONE', 'PERCENTAGE', 'FIXED'] })
  discountType: string;

  @ApiProperty({ example: 10 })
  discountValue: number;

  @ApiProperty({ example: 10.00 })
  discountAmount: number;

  @ApiProperty({ example: 90.00 })
  finalAmount: number;

  @ApiProperty({ type: PassEmployeeDto })
  employee: PassEmployeeDto;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'REDEEMED', 'CANCELLED'] })
  status: string;

  @ApiProperty({ example: '2026-06-02T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-02T12:00:00.000Z' })
  updatedAt: Date;
}
