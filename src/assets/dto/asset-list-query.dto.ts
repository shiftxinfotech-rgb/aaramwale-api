import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AssetListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter assets by outlet ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  outletId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Filter assets by category ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'], description: 'Filter assets by status' })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
