import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CustomerProfileResponseDto {
  @ApiProperty({ example: 1, description: "Customer ID" })
  id: number;

  @ApiProperty({ example: "John Smith", description: "Customer Name" })
  name: string;

  @ApiProperty({ example: "9876543210", description: "Customer Mobile Phone" })
  mobile: string;

  @ApiPropertyOptional({
    example: "john.smith@example.com",
    nullable: true,
    description: "Customer Email Address",
  })
  email: string | null;

  @ApiPropertyOptional({
    example: "MALE",
    nullable: true,
    description: "Customer Gender",
  })
  gender: string | null;

  @ApiPropertyOptional({
    example: "1990-05-15",
    nullable: true,
    description: "Customer Birthday (YYYY-MM-DD)",
  })
  birthday: string | null;

  @ApiPropertyOptional({
    example: "Mumbai",
    nullable: true,
    description: "Customer City",
  })
  city: string | null;

  @ApiPropertyOptional({
    example: "Maharashtra",
    nullable: true,
    description: "Customer State",
  })
  state: string | null;

  @ApiPropertyOptional({
    example: "Andheri West",
    nullable: true,
    description: "Customer Area/Neighborhood",
  })
  area: string | null;

  @ApiPropertyOptional({
    example: "Prefer evening appointments.",
    nullable: true,
    description: "Customer Notes",
  })
  notes: string | null;

  @ApiProperty({ example: 12, description: "Total appointments attended" })
  total_appointments: number;

  @ApiPropertyOptional({
    example: "2026-06-03",
    nullable: true,
    description: "Last visit date (YYYY-MM-DD)",
  })
  last_visit_date: string | null;

  @ApiPropertyOptional({
    example: 4,
    nullable: true,
    description: "Customer Home Outlet ID",
  })
  outletId: number | null;

  @ApiPropertyOptional({
    example: "Jasapar Outlet",
    nullable: true,
    description: "Customer Home Outlet Name",
  })
  outletName: string | null;

  @ApiPropertyOptional({
    type: "object",
    properties: {
      id: { type: "number", example: 4 },
      name: { type: "string", example: "Jasapar Outlet" },
    },
    nullable: true,
    description: "Customer Home Outlet details",
  })
  outlet: { id: number; name: string } | null;
}
