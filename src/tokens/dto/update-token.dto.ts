import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTokenDto {
  @ApiProperty({ example: 'COMPLETED', required: false, enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Rahul Kumar', required: false })
  @IsString()
  @IsOptional()
  customerName?: string;
}
