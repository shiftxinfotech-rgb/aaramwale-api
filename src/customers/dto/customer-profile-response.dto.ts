import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerProfileResponseDto {
  @ApiProperty({ example: 1, description: 'Customer ID' })
  id: number;

  @ApiProperty({ example: 'John Smith', description: 'Customer Name' })
  name: string;

  @ApiProperty({ example: '9876543210', description: 'Customer Mobile Phone' })
  mobile: string;

  @ApiPropertyOptional({ example: 'john.smith@example.com', nullable: true, description: 'Customer Email Address' })
  email: string | null;

  @ApiPropertyOptional({ example: 'MALE', nullable: true, description: 'Customer Gender' })
  gender: string | null;

  @ApiPropertyOptional({ example: '1990-05-15', nullable: true, description: 'Customer Birthday (YYYY-MM-DD)' })
  birthday: string | null;

  @ApiPropertyOptional({ example: 'Mumbai', nullable: true, description: 'Customer City' })
  city: string | null;

  @ApiPropertyOptional({ example: 'Maharashtra', nullable: true, description: 'Customer State' })
  state: string | null;

  @ApiPropertyOptional({ example: 'Andheri West', nullable: true, description: 'Customer Area/Neighborhood' })
  area: string | null;

  @ApiPropertyOptional({ example: 19.1136, nullable: true, description: 'Customer Latitude Coordinate' })
  latitude: number | null;

  @ApiPropertyOptional({ example: 72.8697, nullable: true, description: 'Customer Longitude Coordinate' })
  longitude: number | null;

  @ApiPropertyOptional({ example: 'Prefer evening appointments.', nullable: true, description: 'Customer Notes' })
  notes: string | null;

  @ApiProperty({ example: 250, description: 'Accumulated loyalty points' })
  loyalty_points: number;

  @ApiProperty({ example: 12, description: 'Total appointments attended' })
  total_appointments: number;

  @ApiPropertyOptional({ example: '2026-06-03', nullable: true, description: 'Last visit date (YYYY-MM-DD)' })
  last_visit_date: string | null;

  @ApiPropertyOptional({ example: 3, nullable: true, description: 'Active Membership ID' })
  active_membership_id: number | null;

  @ApiPropertyOptional({ example: 'Platinum Club', nullable: true, description: 'Active Membership Name' })
  membership_name: string | null;

  @ApiPropertyOptional({ example: '2027-06-03', nullable: true, description: 'Active Membership Expiry Date (YYYY-MM-DD)' })
  membership_expiry: string | null;

  @ApiProperty({ example: 2, description: 'Count of active packages' })
  active_packages: number;

  @ApiProperty({ example: 1, description: 'Count of active gift cards' })
  active_gift_cards: number;
}
