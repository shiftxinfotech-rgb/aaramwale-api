import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsIn, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class CategoryListQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    example: "ACTIVE",
    enum: ["ACTIVE", "INACTIVE"],
    description: "Filter categories by status",
  })
  @IsString()
  @IsIn(["ACTIVE", "INACTIVE"])
  @IsOptional()
  status?: "ACTIVE" | "INACTIVE";

  @ApiPropertyOptional({
    example: 4,
    description:
      "Filter categories by outlet ID (only return categories with active assets in this outlet)",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  outletId?: number;
}
