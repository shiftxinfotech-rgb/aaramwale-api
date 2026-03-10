import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumberString, IsOptional } from 'class-validator';

export class TokenListQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Admin only. Filter tokens by outlet id.' })
  @IsOptional()
  @IsNumberString()
  outletId?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filter by chair id.' })
  @IsOptional()
  @IsNumberString()
  chairId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Admin only. Filter by employee id.' })
  @IsOptional()
  @IsNumberString()
  userId?: string;

  @ApiPropertyOptional({ example: '2026-03-10', description: 'Filter tokens created on or after this date.' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-03-10', description: 'Filter tokens created on or before this date.' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
