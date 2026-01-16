import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Token } from './token.entity';
import { Chair } from '../chairs/chair.entity';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(Chair)
    private chairRepository: Repository<Chair>,
  ) {}

  async create(createTokenDto: CreateTokenDto, userId: number, outletId: number): Promise<Token> {
    const { chairId, customerName } = createTokenDto;

    // Verify chair exists and belongs to the outlet
    const chair = await this.chairRepository.findOne({
      where: { id: chairId },
      relations: ['outlet'],
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

    // Generate token number (format: YYYYMMDD-OUTLET-CHAIR-SEQ)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Count tokens created today for this chair
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const todayTokenCount = await this.tokenRepository.count({
      where: {
        chairId,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const tokenNumber = `${dateStr}-${chair.outletId}-${chairId}-${todayTokenCount + 1}`;

    // Create token
    const token = this.tokenRepository.create({
      outletId: chair.outletId,
      chairId,
      userId,
      tokenNumber,
      customerName,
      amount: chair.rentPerToken,
      status: 'ACTIVE',
      startTime: new Date(),
    });

    return this.tokenRepository.save(token);
  }

  async findAll(outletId?: number): Promise<Token[]> {
    const where = outletId ? { outletId } : {};
    
    return this.tokenRepository.find({
      where,
      relations: ['outlet', 'chair', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Token> {
    const token = await this.tokenRepository.findOne({
      where: { id },
      relations: ['outlet', 'chair', 'user'],
    });

    if (!token) {
      throw new NotFoundException(`Token with ID ${id} not found`);
    }

    return token;
  }

  async findByUser(userId: number, outletId?: number): Promise<Token[]> {
    const where: any = { userId };
    if (outletId) {
      where.outletId = outletId;
    }

    return this.tokenRepository.find({
      where,
      relations: ['outlet', 'chair'],
      order: { createdAt: 'DESC' },
    });
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

    // If status is being changed to COMPLETED, set endTime
    if (updateTokenDto.status === 'COMPLETED' && token.status !== 'COMPLETED') {
      token.endTime = new Date();
    }

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
}
