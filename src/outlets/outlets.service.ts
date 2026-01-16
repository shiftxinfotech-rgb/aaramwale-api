import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Outlet } from './outlet.entity';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

@Injectable()
export class OutletsService {
  constructor(
    @InjectRepository(Outlet)
    private outletRepository: Repository<Outlet>,
  ) {}

  async create(createOutletDto: CreateOutletDto): Promise<Outlet> {
    const outlet = this.outletRepository.create(createOutletDto);
    return this.outletRepository.save(outlet);
  }

  async findAll(): Promise<Outlet[]> {
    return this.outletRepository.find({
      relations: ['users', 'chairs'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Outlet> {
    const outlet = await this.outletRepository.findOne({
      where: { id },
      relations: ['users', 'chairs'],
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${id} not found`);
    }

    return outlet;
  }

  async update(id: number, updateOutletDto: UpdateOutletDto): Promise<Outlet> {
    const outlet = await this.findOne(id);
    Object.assign(outlet, updateOutletDto);
    return this.outletRepository.save(outlet);
  }

  async remove(id: number): Promise<void> {
    const outlet = await this.findOne(id);
    await this.outletRepository.remove(outlet);
  }
}
