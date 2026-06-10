import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Smith' })
  name: string;

  @ApiProperty({ example: '9876543210' })
  phone: string;

  @ApiProperty({ example: '2026-03-10', required: false, nullable: true })
  date: string | null;

  @ApiProperty({ example: 'MALE', required: false, nullable: true })
  gender: string | null;

  @ApiProperty({ example: '1990-05-15', required: false, nullable: true })
  birthday: string | null;

  @ApiProperty({ example: 'Mumbai', required: false, nullable: true })
  city: string | null;

  @ApiProperty({ example: 'Maharashtra', required: false, nullable: true })
  state: string | null;

  @ApiProperty({ example: 'Andheri West', required: false, nullable: true })
  area: string | null;

  @ApiProperty({ example: 19.1136, required: false, nullable: true })
  latitude: number | null;

  @ApiProperty({ example: 72.8697, required: false, nullable: true })
  longitude: number | null;

  @ApiProperty({ example: 'Prefer evening appointments.', required: false, nullable: true })
  notes: string | null;

  @ApiProperty({ example: '2026-02-13T14:35:53Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-13T14:35:53Z' })
  updatedAt: Date;
}
