import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChairDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  outletId?: number;

  @ApiProperty({ example: 'Chair-5', required: false })
  @IsString()
  @IsOptional()
  chairNumber?: string;

  @ApiProperty({ example: 150.00, required: false })
  @IsNumber()
  @IsOptional()
  rentPerToken?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
