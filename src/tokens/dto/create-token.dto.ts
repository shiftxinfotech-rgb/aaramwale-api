import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTokenDto {
  @ApiProperty({ example: 1, description: 'ID of the chair being used' })
  @IsNumber()
  @IsNotEmpty()
  chairId: number;

  @ApiPropertyOptional({ example: 50, description: 'Token amount. Defaults to chair rent if omitted' })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'] })
  @IsIn(['ACTIVE', 'COMPLETED', 'CANCELLED'])
  @IsString()
  @IsOptional()
  status?: string;
}
