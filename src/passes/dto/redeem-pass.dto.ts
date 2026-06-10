import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RedeemPassItemInputDto {
  @ApiProperty({ example: 1, description: 'Pass Item ID' })
  @IsNumber()
  @IsNotEmpty()
  passItemId: number;

  @ApiProperty({ example: 1, description: 'Quantity to redeem' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  redeemQuantity: number;
}

export class RedeemPassDto {
  @ApiProperty({ type: [RedeemPassItemInputDto], description: 'Items to redeem' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RedeemPassItemInputDto)
  @IsNotEmpty()
  items: RedeemPassItemInputDto[];

  @ApiPropertyOptional({ example: 'Customer used service', description: 'Optional remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}
