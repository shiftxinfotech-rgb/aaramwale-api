import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenDto {
  @ApiProperty({ example: 1, description: 'ID of the chair being used' })
  @IsNumber()
  @IsNotEmpty()
  chairId: number;

  @ApiProperty({ example: 'Rahul Kumar', required: false })
  @IsString()
  @IsOptional()
  customerName?: string;
}
