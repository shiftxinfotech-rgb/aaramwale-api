import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 1, required: true, description: 'Required for employees' })
    @IsNumber()
    @IsNotEmpty()
    outletId: number;

    @ApiProperty({ example: true, required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
