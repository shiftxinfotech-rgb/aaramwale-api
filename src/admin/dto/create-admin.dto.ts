import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
    @ApiProperty({ example: 'Admin User' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'admin@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: true, required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
