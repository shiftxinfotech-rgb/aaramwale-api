import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CustomerListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: '8089329348', description: 'Filter customers by phone number' })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({ example: 4, description: 'Filter customers by outlet ID' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  outletId?: number;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Filter visits from date' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Filter visits to date' })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}
