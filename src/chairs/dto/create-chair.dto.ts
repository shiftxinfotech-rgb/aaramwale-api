import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateChairDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  outletId: number;

  @ApiProperty({ example: 'Chair-1' })
  @IsString()
  @IsNotEmpty()
  chairNumber: string;

  @ApiProperty({ example: 100.00 })
  @IsNumber()
  @IsNotEmpty()
  rentPerToken: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
