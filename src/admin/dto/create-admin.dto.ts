import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAdminDto {
  @ApiProperty({ example: "Admin User" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "admin@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "Admin@123" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: "9876543210", required: false })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Accepted but ignored — role is always forced to ADMIN by the service
  @IsOptional()
  role?: any;

  // Accepted but ignored — admins never belong to an outlet
  @IsOptional()
  outletId?: any;
}
