import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCustomerDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "9876543210" })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({
    example: "9876543210",
    description: "Alias for mobile field (for backward compatibility)",
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: "2026-01-20", required: false })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: "john.doe@example.com" })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "MALE" })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: "1990-05-15" })
  @IsDateString()
  @IsOptional()
  birthday?: string;

  @ApiPropertyOptional({ example: "Mumbai" })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: "Maharashtra" })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: "Andheri West" })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiPropertyOptional({ example: "Prefer evening appointments." })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  totalAppointments?: number;

  @ApiPropertyOptional({ example: "2026-06-03" })
  @IsDateString()
  @IsOptional()
  lastVisitDate?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsNumber()
  @IsOptional()
  outletId?: number;
}
