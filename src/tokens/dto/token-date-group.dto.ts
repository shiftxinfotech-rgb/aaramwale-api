import { ApiProperty } from '@nestjs/swagger';
import { TokenListItemDto } from './token-list-item.dto';

export class TokenDateGroupDto {
  @ApiProperty({ example: '2026-03-10' })
  date: string;

  @ApiProperty({ example: 14 })
  totalTokens: number;

  @ApiProperty({ example: 700 })
  totalRevenue: number;

  @ApiProperty({ type: () => TokenListItemDto, isArray: true })
  tokens: TokenListItemDto[];
}
