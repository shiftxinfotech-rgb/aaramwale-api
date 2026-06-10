import { ApiProperty } from '@nestjs/swagger';

export class PassCustomerDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: '9876543210' })
  phone: string;
}

export class PassAssetDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'MC-001' })
  assetCode: string;

  @ApiProperty({ example: 'Massage Chair 1' })
  assetName: string;
}

export class PassCategoryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Massage Chair' })
  name: string;
}

export class PassEmployeeDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 'Rahul' })
  name: string;
}
