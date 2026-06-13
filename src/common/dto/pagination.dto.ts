import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, description: "Page number (minimum 1)" })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: "Number of items per page (max 1000)",
  })
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: "search_term",
    description: "Search term for queries",
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: "createdAt",
    description: "Field name to sort by",
  })
  @IsString()
  @IsOptional()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({
    example: "DESC",
    enum: ["ASC", "DESC"],
    description: "Sort order",
  })
  @IsString()
  @IsIn(["ASC", "DESC"])
  @IsOptional()
  sortOrder?: "ASC" | "DESC" = "DESC";
}
