import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class EmployeeListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 4, description: 'Filter employees by outlet ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  outletId?: number;

  @ApiPropertyOptional({ example: 'EMPLOYEE', enum: ['EMPLOYEE', 'ADMIN'], description: 'Filter employees by role' })
  @IsOptional()
  @IsString()
  @IsIn(['EMPLOYEE', 'ADMIN'])
  role?: 'EMPLOYEE' | 'ADMIN';

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'], description: 'Filter employees by status' })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
