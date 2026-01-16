import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chair } from './chair.entity';
import { CreateChairDto } from './dto/create-chair.dto';
import { UpdateChairDto } from './dto/update-chair.dto';

@Injectable()
export class ChairsService {
  constructor(
    @InjectRepository(Chair)
    private chairRepository: Repository<Chair>,
  ) {}

  async create(createChairDto: CreateChairDto): Promise<Chair> {
    const chair = this.chairRepository.create(createChairDto);
    return this.chairRepository.save(chair);
  }

  async findAll(): Promise<Chair[]> {
    return this.chairRepository.find({
      relations: ['outlet'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Chair> {
    const chair = await this.chairRepository.findOne({
      where: { id },
      relations: ['outlet'],
    });

    if (!chair) {
      throw new NotFoundException(`Chair with ID ${id} not found`);
    }

    return chair;
  }

  async findByOutlet(outletId: number): Promise<Chair[]> {
    return this.chairRepository.find({
      where: { outletId },
      relations: ['outlet'],
      order: { chairNumber: 'ASC' },
    });
  }

  async update(id: number, updateChairDto: UpdateChairDto): Promise<Chair> {
    const chair = await this.findOne(id);
    Object.assign(chair, updateChairDto);
    return this.chairRepository.save(chair);
  }

  async remove(id: number): Promise<void> {
    const chair = await this.findOne(id);
    await this.chairRepository.remove(chair);
  }
}
