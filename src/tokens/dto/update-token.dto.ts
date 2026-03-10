import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTokenDto {
  @ApiPropertyOptional({ example: 'COMPLETED', enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'] })
  @IsIn(['ACTIVE', 'COMPLETED', 'CANCELLED'])
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @IsOptional()
  amount?: number;
}
