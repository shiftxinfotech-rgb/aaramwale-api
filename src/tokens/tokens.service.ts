import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Token } from './token.entity';
import { Chair } from '../chairs/chair.entity';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { TokenListQueryDto } from './dto/token-list-query.dto';
import { TokenListItemDto } from './dto/token-list-item.dto';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(Chair)
    private chairRepository: Repository<Chair>,
  ) {}

  async create(createTokenDto: CreateTokenDto, userId: number, outletId: number): Promise<Token> {
    const { chairId, amount, status } = createTokenDto;

    const chair = await this.chairRepository.findOne({
      where: { id: chairId },
    });

    if (!chair) {
      throw new NotFoundException(`Chair with ID ${chairId} not found`);
    }

    if (chair.outletId !== outletId) {
      throw new BadRequestException('Chair does not belong to your outlet');
    }

    if (!chair.isActive) {
      throw new BadRequestException('Chair is not active');
    }

    const token = this.tokenRepository.create({
      outletId: chair.outletId,
      chairId,
      userId,
      amount: amount ?? chair.rentPerToken,
      status: status ?? 'ACTIVE',
    });

    return this.tokenRepository.save(token);
  }

  async findAll(filters: {
    outletId?: number;
    status?: string;
    chairId?: number;
    userId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<TokenListItemDto[]> {
    const where = this.buildWhere(filters);

    const tokens = await this.tokenRepository.find({
      where,
      relations: ['outlet', 'chair', 'user'],
      order: { createdAt: 'DESC' },
    });

    return tokens.map((token) => this.toListItem(token));
  }

  async findOne(id: number, outletId?: number): Promise<Token> {
    const token = await this.tokenRepository.findOne({
      where: outletId ? { id, outletId } : { id },
      relations: ['outlet', 'chair', 'user'],
    });

    if (!token) {
      throw new NotFoundException(`Token with ID ${id} not found`);
    }

    return token;
  }

  async findByUser(userId: number, outletId?: number, query?: Omit<TokenListQueryDto, 'outletId' | 'userId'>): Promise<TokenListItemDto[]> {
    const where = this.buildWhere({
      userId,
      outletId,
      status: query?.status,
      chairId: query?.chairId ? +query.chairId : undefined,
      fromDate: query?.fromDate ? new Date(`${query.fromDate}T00:00:00.000Z`) : undefined,
      toDate: query?.toDate ? new Date(`${query.toDate}T23:59:59.999Z`) : undefined,
    });

    const tokens = await this.tokenRepository.find({
      where,
      relations: ['outlet', 'chair', 'user'],
      order: { createdAt: 'DESC' },
    });

    return tokens.map((token) => this.toListItem(token));
  }

  async findByOutlet(outletId: number): Promise<Token[]> {
    return this.tokenRepository.find({
      where: { outletId },
      relations: ['chair', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date, outletId?: number): Promise<Token[]> {
    const where: any = {
      createdAt: Between(startDate, endDate),
    };

    if (outletId) {
      where.outletId = outletId;
    }

    return this.tokenRepository.find({
      where,
      relations: ['outlet', 'chair', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateTokenDto: UpdateTokenDto): Promise<Token> {
    const token = await this.findOne(id);

    Object.assign(token, updateTokenDto);
    return this.tokenRepository.save(token);
  }

  async remove(id: number): Promise<void> {
    const token = await this.findOne(id);
    await this.tokenRepository.remove(token);
  }

  async getTodayStats(outletId?: number) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const where: any = {
      createdAt: Between(startOfDay, endOfDay),
    };

    if (outletId) {
      where.outletId = outletId;
    }

    const tokens = await this.tokenRepository.find({ where });

    const totalTokens = tokens.length;
    const activeTokens = tokens.filter((t) => t.status === 'ACTIVE').length;
    const completedTokens = tokens.filter((t) => t.status === 'COMPLETED').length;
    const totalRevenue = tokens.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalTokens,
      activeTokens,
      completedTokens,
      totalRevenue,
      date: startOfDay.toISOString().split('T')[0],
    };
  }

  private buildWhere(filters: {
    outletId?: number;
    status?: string;
    chairId?: number;
    userId?: number;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: any = {};

    if (filters.outletId) {
      where.outletId = filters.outletId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.chairId) {
      where.chairId = filters.chairId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.fromDate && filters.toDate) {
      where.createdAt = Between(filters.fromDate, filters.toDate);
    } else if (filters.fromDate) {
      where.createdAt = Between(filters.fromDate, new Date('9999-12-31T23:59:59.999Z'));
    } else if (filters.toDate) {
      where.createdAt = Between(new Date('1970-01-01T00:00:00.000Z'), filters.toDate);
    }

    return where;
  }

  private toListItem(token: Token): TokenListItemDto {
    return {
      id: token.id,
      outletId: token.outletId,
      outletName: token.outlet?.name ?? '',
      chairId: token.chairId,
      chairNumber: token.chair?.chairNumber ?? '',
      userId: token.userId,
      employeeName: token.user?.name ?? '',
      employeeEmail: token.user?.email ?? '',
      amount: Number(token.amount),
      status: token.status,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
    };
  }
}
