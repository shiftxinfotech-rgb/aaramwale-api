import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsIn } from "class-validator";

export class UpdatePassDto {
  @ApiPropertyOptional({
    example: "CANCELLED",
    enum: ["ACTIVE", "PARTIALLY_REDEEMED", "FULLY_REDEEMED", "CANCELLED"],
  })
  @IsIn(["ACTIVE", "PARTIALLY_REDEEMED", "FULLY_REDEEMED", "CANCELLED"])
  @IsOptional()
  status?: string;
}
