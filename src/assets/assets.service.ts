import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Category } from '../categories/category.entity';
import { Outlet } from '../outlets/outlet.entity';
import { AssetListQueryDto } from './dto/asset-list-query.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Outlet)
    private outletRepository: Repository<Outlet>,
  ) {}

  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    const { categoryId, outletId, assetCode } = createAssetDto;

    // Verify Category exists
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Verify Outlet exists
    const outlet = await this.outletRepository.findOne({ where: { id: outletId } });
    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${outletId} not found`);
    }

    // Verify unique assetCode in this outlet
    const existing = await this.assetRepository.findOne({
      where: { outletId, assetCode },
    });
    if (existing) {
      throw new BadRequestException(`Asset with code "${assetCode}" already exists at outlet ${outletId}`);
    }

    const asset = this.assetRepository.create(createAssetDto);
    return this.assetRepository.save(asset);
  }

  async findAll(query: AssetListQueryDto): Promise<any> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC', status, outletId, categoryId } = query;

    const queryBuilder = this.assetRepository.createQueryBuilder('asset')
      .leftJoinAndSelect('asset.outlet', 'outlet')
      .leftJoinAndSelect('asset.category', 'category');

    if (outletId) {
      queryBuilder.andWhere('asset.outletId = :outletId', { outletId });
    }

    if (categoryId) {
      queryBuilder.andWhere('asset.categoryId = :categoryId', { categoryId });
    }

    if (status) {
      const isActive = status === 'ACTIVE';
      queryBuilder.andWhere('asset.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(asset.assetName ILIKE :search OR asset.assetCode ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const allowedSortFields = ['id', 'assetCode', 'assetName', 'unitPrice', 'durationMinutes', 'isActive', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(`asset.${sortField}`, order);

    const totalRecords = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * limit).take(limit);

    const assets = await queryBuilder.getMany();
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: assets,
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

  async findOne(id: number): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { id },
      relations: ['outlet', 'category'],
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  async findByOutlet(outletId: number): Promise<Asset[]> {
    return this.assetRepository.find({
      where: { outletId },
      relations: ['outlet', 'category'],
      order: { assetCode: 'ASC' },
    });
  }

  async findByCategory(categoryId: number): Promise<Asset[]> {
    return this.assetRepository.find({
      where: { categoryId },
      relations: ['outlet', 'category'],
      order: { assetCode: 'ASC' },
    });
  }

  async findByOutletAndCategory(outletId: number, categoryId: number): Promise<Asset[]> {
    return this.assetRepository.find({
      where: { outletId, categoryId },
      relations: ['outlet', 'category'],
      order: { assetCode: 'ASC' },
    });
  }

  async update(id: number, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    const asset = await this.findOne(id);

    if (updateAssetDto.categoryId && updateAssetDto.categoryId !== asset.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: updateAssetDto.categoryId } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${updateAssetDto.categoryId} not found`);
      }
    }

    if (updateAssetDto.outletId && updateAssetDto.outletId !== asset.outletId) {
      const outlet = await this.outletRepository.findOne({ where: { id: updateAssetDto.outletId } });
      if (!outlet) {
        throw new NotFoundException(`Outlet with ID ${updateAssetDto.outletId} not found`);
      }
    }

    const nextOutletId = updateAssetDto.outletId ?? asset.outletId;
    const nextAssetCode = updateAssetDto.assetCode ?? asset.assetCode;

    if (updateAssetDto.assetCode || updateAssetDto.outletId) {
      const existing = await this.assetRepository.findOne({
        where: { outletId: nextOutletId, assetCode: nextAssetCode },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Asset with code "${nextAssetCode}" already exists at outlet ${nextOutletId}`);
      }
    }

    Object.assign(asset, updateAssetDto);
    return this.assetRepository.save(asset);
  }

  async remove(id: number): Promise<void> {
    const asset = await this.findOne(id);
    await this.assetRepository.remove(asset);
  }
}
