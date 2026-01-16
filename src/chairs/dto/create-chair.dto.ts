import { ApiProperty } from '@nestjs/swagger';

export class CreateChairDto {
  @ApiProperty()
  outletId: number;

  @ApiProperty()
  chairNumber: string;

  @ApiProperty()
  rentPerToken: number;
}
