import { ApiProperty } from '@nestjs/swagger';

export class CategoryWiseReportDto {
  @ApiProperty({ example: 1 })
  categoryId: number;

  @ApiProperty({ example: 'Massage Chair' })
  categoryName: string;

  @ApiProperty({ example: 12 })
  totalPasses: number;

  @ApiProperty({ example: 1200.00 })
  totalRevenue: number;
}
