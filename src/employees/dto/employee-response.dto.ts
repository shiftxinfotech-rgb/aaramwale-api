import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "../../users/user.entity";

export class EmployeeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "John Doe" })
  name: string;

  @ApiProperty({ example: "aaramwala.rajkot@gmail.com" })
  email: string;

  @ApiPropertyOptional({ example: "9876543210", nullable: true })
  mobile: string | null;

  @ApiProperty({ example: UserRole.EMPLOYEE, enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 1, nullable: true })
  outletId: number | null;

  @ApiPropertyOptional({ example: "Jasapar", nullable: true })
  outletName: string | null;

  @ApiProperty({
    example: true,
    description: "Whether the employee is currently clocked in",
  })
  isClockedIn: boolean;

  @ApiPropertyOptional({
    example: "2026-02-13T09:00:00Z",
    nullable: true,
    description: "Last clock-in time if currently working",
  })
  lastClockIn: Date | null;

  @ApiProperty({ example: "2026-02-13T14:35:53Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-02-13T14:35:53Z" })
  updatedAt: Date;
}
