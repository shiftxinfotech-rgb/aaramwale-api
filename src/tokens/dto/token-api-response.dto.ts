import { ApiProperty } from '@nestjs/swagger';
import { TokenResponseDto } from './token-response.dto';
import { TokenStatsDto } from './token-stats.dto';
import { TokenListItemDto } from './token-list-item.dto';
import { TokenDateGroupDto } from './token-date-group.dto';

export class TokenItemApiResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Token created successfully' })
  message: string;

  @ApiProperty({ type: () => TokenResponseDto })
  data: TokenResponseDto;

  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-10T12:00:00.000Z' })
  timestamp: string;
}

export class TokenListApiResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Tokens retrieved successfully' })
  message: string;

  @ApiProperty({ type: () => TokenListItemDto, isArray: true })
  data: TokenListItemDto[];

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-10T12:00:00.000Z' })
  timestamp: string;
}

export class TokenStatsApiResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Today's statistics retrieved successfully" })
  message: string;

  @ApiProperty({ type: () => TokenStatsDto })
  data: TokenStatsDto;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-10T12:00:00.000Z' })
  timestamp: string;
}

export class TokenDateWiseApiResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Date-wise tokens retrieved successfully' })
  message: string;

  @ApiProperty({ type: () => TokenDateGroupDto, isArray: true })
  data: TokenDateGroupDto[];

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-10T12:00:00.000Z' })
  timestamp: string;
}

export class EmptyApiResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Token deleted successfully' })
  message: string;

  @ApiProperty({ type: 'object', additionalProperties: false, nullable: true, example: null })
  data: null;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-10T12:00:00.000Z' })
  timestamp: string;
}

export class ErrorApiResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Chair does not belong to your outlet' })
  message: string;

  @ApiProperty({ type: 'object', additionalProperties: false, nullable: true, example: null })
  data: null;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: '2026-03-10T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/tokens' })
  path: string;
}
