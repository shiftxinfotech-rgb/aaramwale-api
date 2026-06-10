import { ApiProperty } from '@nestjs/swagger';

export class TopCustomersReportDto {
  @ApiProperty({ example: 12 })
  customerId: number;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiProperty({ example: '9876543210' })
  customerPhone: string;

  @ApiProperty({ example: 5, description: 'Total number of passes purchased' })
  totalPasses: number;

  @ApiProperty({ example: 500.00, description: 'Total revenue spent by customer' })
  totalSpend: number;
}
