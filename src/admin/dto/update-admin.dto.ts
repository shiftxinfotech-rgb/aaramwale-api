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

  @ApiProperty({ example: "newpassword123", required: false })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
