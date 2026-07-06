import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "./category.entity";
import { Asset } from "../assets/asset.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryListQueryDto } from "./dto/category-list-query.dto";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
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

    if (outletId) {
      // 1. Find all active assets in the selected outlet and join their categories
      const assets = await this.assetRepository.find({
        where: {
          outletId,
          isActive: true,
        },
        relations: ["category"],
      });

      // 2. Extract unique categories from those assets
      const categoriesMap = new Map<number, Category>();
      for (const asset of assets) {
        if (asset.category) {
          // If category status filter is passed
          if (status) {
            const matchActive = status === "ACTIVE";
            if (asset.category.isActive !== matchActive) {
              continue;
            }
          }
          // If search term filter is passed
          if (search) {
            if (!asset.category.name.toLowerCase().includes(search.toLowerCase())) {
              continue;
            }
          }
          categoriesMap.set(asset.category.id, asset.category);
        }
      }

      const categories = Array.from(categoriesMap.values());

      // 3. Sort the extracted unique categories
      const allowedSortFields = ["id", "name", "isActive", "createdAt"];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
      const orderMultiplier = sortOrder === "ASC" ? 1 : -1;

      categories.sort((a, b) => {
        let valA = a[sortField as keyof Category];
        let valB = b[sortField as keyof Category];

        if (valA instanceof Date) valA = valA.getTime() as any;
        if (valB instanceof Date) valB = valB.getTime() as any;

        if (valA < valB) return -1 * orderMultiplier;
        if (valA > valB) return 1 * orderMultiplier;
        return 0;
      });

      // 4. Paginate the resulting unique categories
      const totalRecords = categories.length;
      const totalPages = Math.ceil(totalRecords / limit);
      const paginatedData = categories.slice((page - 1) * limit, page * limit);

      return {
        data: paginatedData,
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

    // Default behavior when outletId is not provided
    const queryBuilder = this.categoryRepository.createQueryBuilder("category");

    if (status) {
      const isActive = status === "ACTIVE";
      queryBuilder.andWhere("category.isActive = :isActive", { isActive });
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
