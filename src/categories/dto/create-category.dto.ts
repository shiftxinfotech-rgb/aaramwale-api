import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Massage Chair', description: 'Name of the category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Full body reclining massage chairs', description: 'Description of the category' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'Is this category active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
