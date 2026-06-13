import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "./category.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryListQueryDto } from "./dto/category-list-query.dto";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new BadRequestException(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(query: CategoryListQueryDto): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "DESC",
      status,
      outletId,
    } = query;

    const queryBuilder = this.categoryRepository.createQueryBuilder("category");

    if (status) {
      const isActive = status === "ACTIVE";
      queryBuilder.andWhere("category.isActive = :isActive", { isActive });
    }

    if (outletId) {
      queryBuilder.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select("asset.categoryId")
          .from("assets", "asset")
          .where("asset.outletId = :outletId")
          .andWhere("asset.isActive = :isActiveAsset")
          .getQuery();
        return "category.id IN " + subQuery;
      });
      queryBuilder.setParameter("outletId", outletId);
      queryBuilder.setParameter("isActiveAsset", true);
    }

    if (search) {
      queryBuilder.andWhere("category.name ILIKE :search", {
        search: `%${search}%`,
      });
    }

    const allowedSortFields = ["id", "name", "isActive", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const order = sortOrder === "ASC" ? "ASC" : "DESC";

    queryBuilder.orderBy(`category.${sortField}`, order);

    const totalRecords = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * limit).take(limit);

    const categories = await queryBuilder.getMany();
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: categories,
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

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (existing) {
        throw new BadRequestException(
          `Category with name "${updateCategoryDto.name}" already exists`,
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}
