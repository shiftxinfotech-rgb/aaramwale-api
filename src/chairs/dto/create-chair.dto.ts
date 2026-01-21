import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

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
}
