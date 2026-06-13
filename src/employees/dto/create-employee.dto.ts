import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "../../users/user.entity";

export class CreateEmployeeDto {
  @ApiProperty({
    example: "John Doe",
    description: "Full name of the employee",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "john.doe@aaramwala.com",
    description: "Unique email address",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "Password@123", description: "Minimum 6 characters" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: "9876543210", description: "Mobile number" })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty({
    example: 1,
    description:
      "Required for EMPLOYEE role. Must be a valid outlet ID. Ignored for ADMIN role.",
  })
  @IsNumber()
  @IsOptional()
  outletId?: number;

  @ApiPropertyOptional({
    example: UserRole.EMPLOYEE,
    enum: UserRole,
    description:
      "Role to assign. ADMIN can only create EMPLOYEE. SUPER_ADMIN can create ADMIN or EMPLOYEE. Defaults to EMPLOYEE.",
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    example: true,
    description: "Whether the account is active. Defaults to true.",
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
