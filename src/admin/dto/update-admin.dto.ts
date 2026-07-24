import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateAdminDto {
  @ApiProperty({ example: "Admin User", required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: "admin@example.com", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: "newpassword123", required: false })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({ example: "9876543210", required: false })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  role?: any;

  @IsOptional()
  outletId?: any;
}
