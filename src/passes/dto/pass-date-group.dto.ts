import { ApiProperty } from "@nestjs/swagger";
import { PassResponseDto } from "./pass-response.dto";

export class PassDateGroupDto {
  @ApiProperty({ example: "2026-06-02" })
  date: string;

  @ApiProperty({ example: 3 })
  totalPasses: number;

  @ApiProperty({ example: 300.0 })
  totalRevenue: number;

  @ApiProperty({ type: [PassResponseDto] })
  passes: PassResponseDto[];
}
