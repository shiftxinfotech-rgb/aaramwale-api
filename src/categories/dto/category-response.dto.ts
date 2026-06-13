import { ApiProperty } from "@nestjs/swagger";

export class CategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Massage Chair" })
  name: string;

  @ApiProperty({
    example: "Full body reclining massage chairs",
    nullable: true,
  })
  description: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "2026-06-02T12:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2026-06-02T12:00:00.000Z" })
  updatedAt: Date;
}
