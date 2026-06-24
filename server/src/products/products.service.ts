import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSort, QueryProductDto } from './dto/query-product.dto';
import { ProductStatus, Role } from '../common/enums';
import { StoresService } from '../stores/stores.service';
import { PaginatedResult, paginate } from '../common/dto/pagination-query.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';

export interface ProductWithRating extends Product {
  avgRating: number;
  reviewCount: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    private readonly storesService: StoresService,
  ) {}

  async create(sellerId: string, dto: CreateProductDto): Promise<Product> {
    const store = await this.storesService.getMine(sellerId);
    const category = await this.categoriesRepo.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const product = this.productsRepo.create({
      title: dto.title,
      description: dto.description,
      price: dto.price.toFixed(2),
      stock: dto.stock,
      categoryId: dto.categoryId,
      status: dto.status ?? ProductStatus.DRAFT,
      images: dto.images ?? [],
      storeId: store.id,
    });
    return this.productsRepo.save(product);
  }

  async findAll(
    query: QueryProductDto,
  ): Promise<PaginatedResult<ProductWithRating>> {
    const qb = this.buildFilteredQuery(query);
    return this.executePaginated(qb, query);
  }

  /** Seller-scoped listing for the dashboard (includes drafts/inactive). */
  async findForStore(
    storeId: string,
    query: QueryProductDto,
  ): Promise<PaginatedResult<ProductWithRating>> {
    const qb = this.buildFilteredQuery({
      ...query,
      storeId,
      includeInactive: true,
    });
    return this.executePaginated(qb, query);
  }

  private buildFilteredQuery(
    query: QueryProductDto,
  ): SelectQueryBuilder<Product> {
    const qb = this.productsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.store', 'store')
      .leftJoin('p.reviews', 'r')
      .addSelect('COALESCE(AVG(r.rating), 0)', 'avgRating')
      .addSelect('COUNT(DISTINCT r.id)', 'reviewCount')
      .addSelect('COUNT(*) OVER()', 'totalCount')
      .groupBy('p.id')
      .addGroupBy('category.id')
      .addGroupBy('store.id');

    if (!query.includeInactive) {
      qb.andWhere('p.status = :active', { active: ProductStatus.ACTIVE });
    }
    if (query.q) {
      qb.andWhere('(p.title ILIKE :q OR p.description ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }
    if (query.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.category) {
      qb.andWhere('category.slug = :categorySlug', {
        categorySlug: query.category,
      });
    }
    if (query.storeId) {
      qb.andWhere('p.storeId = :storeId', { storeId: query.storeId });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('p.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice: query.maxPrice });
    }
    if (query.inStock === 'true') {
      qb.andWhere('p.stock > 0');
    }
    if (query.minRating !== undefined) {
      qb.having('COALESCE(AVG(r.rating), 0) >= :minRating', {
        minRating: query.minRating,
      });
    }

    switch (query.sort) {
      case ProductSort.PRICE_ASC:
        qb.orderBy('p.price', 'ASC');
        break;
      case ProductSort.PRICE_DESC:
        qb.orderBy('p.price', 'DESC');
        break;
      case ProductSort.BEST_RATED:
        qb.orderBy('AVG(r.rating)', 'DESC', 'NULLS LAST');
        break;
      case ProductSort.NEWEST:
      default:
        qb.orderBy('p.createdAt', 'DESC');
        break;
    }
    return qb;
  }

  private async executePaginated(
    qb: SelectQueryBuilder<Product>,
    query: QueryProductDto,
  ): Promise<PaginatedResult<ProductWithRating>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.offset((page - 1) * limit).limit(limit);

    const { entities, raw } = await qb.getRawAndEntities();
    const total =
      raw.length > 0
        ? Number((raw[0] as { totalCount: string }).totalCount)
        : 0;

    const data: ProductWithRating[] = entities.map((entity, i) => {
      const rawRow = raw[i] as { avgRating: string; reviewCount: string };
      return Object.assign(entity, {
        avgRating: Number(Number(rawRow.avgRating).toFixed(2)),
        reviewCount: Number(rawRow.reviewCount),
      });
    });
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<ProductWithRating> {
    const qb = this.productsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.store', 'store')
      .leftJoin('p.reviews', 'r')
      .addSelect('COALESCE(AVG(r.rating), 0)', 'avgRating')
      .addSelect('COUNT(DISTINCT r.id)', 'reviewCount')
      .where('p.id = :id', { id })
      .groupBy('p.id')
      .addGroupBy('category.id')
      .addGroupBy('store.id');

    const raw = await qb.getRawOne<{
      avgRating: string;
      reviewCount: string;
    }>();
    const entity = await qb.getOne();
    if (!entity) {
      throw new NotFoundException('Product not found');
    }
    return Object.assign(entity, {
      avgRating: raw ? Number(Number(raw.avgRating).toFixed(2)) : 0,
      reviewCount: raw ? Number(raw.reviewCount) : 0,
    });
  }

  async findRelated(id: string, limit = 4): Promise<Product[]> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.productsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.categoryId = :categoryId', { categoryId: product.categoryId })
      .andWhere('p.id != :id', { id })
      .andWhere('p.status = :active', { active: ProductStatus.ACTIVE })
      .orderBy('p.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      const category = await this.categoriesRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }
    const { price, ...rest } = dto;
    Object.assign(product, rest);
    if (price !== undefined) {
      product.price = price.toFixed(2);
    }
    return this.productsRepo.save(product);
  }

  async remove(id: string, user: AuthUser): Promise<{ deleted: true }> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (user.role !== Role.ADMIN) {
      const store = await this.storesService.getMine(user.id);
      if (store.id !== product.storeId) {
        throw new ForbiddenException('You do not own this product');
      }
    }
    await this.productsRepo.remove(product);
    return { deleted: true };
  }

  async addImages(id: string, urls: string[]): Promise<Product> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    product.images = [...product.images, ...urls].slice(0, 5);
    return this.productsRepo.save(product);
  }
}
