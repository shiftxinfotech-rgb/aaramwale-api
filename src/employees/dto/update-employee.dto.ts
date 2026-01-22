import { IsEmail, IsString, MinLength, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmployeeDto {
    @ApiProperty({ example: 'John Doe', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'john@example.com', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ example: 'newpassword123', required: false })
    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

    @ApiProperty({ example: 1, required: false })
    @IsNumber()
    @IsOptional()
    outletId?: number;

    @ApiProperty({ example: true, required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
