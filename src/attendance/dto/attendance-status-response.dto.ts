import { ApiProperty } from "@nestjs/swagger";
import { AttendanceResponseDto } from "./attendance-response.dto";

export class AttendanceStatusResponseDto {
  @ApiProperty({
    example: true,
    description: "Whether the user is currently clocked in",
  })
  isClockedIn: boolean;

  @ApiProperty({
    type: AttendanceResponseDto,
    nullable: true,
    description: "Current active session if clocked in",
  })
  session: AttendanceResponseDto | null;
}
