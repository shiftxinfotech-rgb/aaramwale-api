import { IsNotEmpty, IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '2026-01-20', required: false })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'MALE' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsDateString()
  @IsOptional()
  birthday?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Andheri West' })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiPropertyOptional({ example: 19.1136 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 72.8697 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Prefer evening appointments.' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsOptional()
  loyaltyPoints?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  activeMembershipId?: number;

  @ApiPropertyOptional({ example: 'Platinum Club' })
  @IsString()
  @IsOptional()
  membershipName?: string;

  @ApiPropertyOptional({ example: '2027-06-03' })
  @IsDateString()
  @IsOptional()
  membershipExpiry?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  activePackages?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  activeGiftCards?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  totalAppointments?: number;

  @ApiPropertyOptional({ example: '2026-06-03' })
  @IsDateString()
  @IsOptional()
  lastVisitDate?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsNumber()
  @IsOptional()
  outletId?: number;
}
