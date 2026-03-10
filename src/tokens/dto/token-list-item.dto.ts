import { ApiProperty } from '@nestjs/swagger';

export class TokenListItemDto {
  @ApiProperty({ example: 10 })
  id: number;

  @ApiProperty({ example: 1 })
  outletId: number;

  @ApiProperty({ example: 'Aaramwale Pune' })
  outletName: string;

  @ApiProperty({ example: 3 })
  chairId: number;

  @ApiProperty({ example: 'C-03' })
  chairNumber: string;

  @ApiProperty({ example: 7 })
  userId: number;

  @ApiProperty({ example: 'Rahul Sharma' })
  employeeName: string;

  @ApiProperty({ example: 'rahul@aaramwale.com' })
  employeeEmail: string;

  @ApiProperty({ example: 50 })
  amount: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: '2026-03-10T09:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-10T09:30:00.000Z' })
  updatedAt: Date;
}
