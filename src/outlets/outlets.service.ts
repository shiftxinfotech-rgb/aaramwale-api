import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Outlet } from './outlet.entity';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { User } from '../users/user.entity';
import { Chair } from '../chairs/chair.entity';
import { Token } from '../tokens/token.entity';

@Injectable()
export class OutletsService {
  constructor(
    @InjectRepository(Outlet)
    private outletRepository: Repository<Outlet>,
    private dataSource: DataSource,
  ) { }

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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Delete all tokens associated with this outlet
      await queryRunner.manager.delete(Token, { outletId: id });

      // 2. Delete all chairs associated with this outlet
      await queryRunner.manager.delete(Chair, { outletId: id });

      // 3. Delete all users associated with this outlet
      await queryRunner.manager.delete(User, { outletId: id });

      // 4. Finally delete the outlet
      await queryRunner.manager.remove(outlet);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
