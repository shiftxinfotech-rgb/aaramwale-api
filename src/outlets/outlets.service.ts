import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Outlet } from './outlet.entity';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { OutletListQueryDto } from './dto/outlet-list-query.dto';
import { User } from '../users/user.entity';
import { Asset } from '../assets/asset.entity';
import { Pass } from '../passes/pass.entity';

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

  async findAll(query: OutletListQueryDto): Promise<any> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC', status } = query;

    const queryBuilder = this.outletRepository.createQueryBuilder('outlet')
      .leftJoinAndSelect('outlet.users', 'user')
      .leftJoinAndSelect('outlet.assets', 'asset');

    if (status) {
      const isActive = status === 'ACTIVE';
      queryBuilder.andWhere('outlet.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(outlet.name ILIKE :search OR outlet.city ILIKE :search OR outlet.address ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const allowedSortFields = ['id', 'name', 'city', 'isActive', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(`outlet.${sortField}`, order);

    const totalRecords = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * limit).take(limit);

    const outlets = await queryBuilder.getMany();
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: outlets,
      meta: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number): Promise<Outlet> {
    const outlet = await this.outletRepository.findOne({
      where: { id },
      relations: ['users', 'assets'],
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
      // 1. Delete all passes associated with this outlet
      await queryRunner.manager.delete(Pass, { outletId: id });

      // 2. Delete all assets associated with this outlet
      await queryRunner.manager.delete(Asset, { outletId: id });

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
