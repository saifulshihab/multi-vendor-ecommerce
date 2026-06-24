import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Store } from '../stores/entities/store.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStatus, ProductStatus, Role } from '../common/enums';
import { UsersService } from '../users/users.service';
import { StoresService } from '../stores/stores.service';
import { ProductsService } from '../products/products.service';
import { SettingsService } from '../settings/settings.service';
import { QueryProductDto } from '../products/dto/query-product.dto';
import {
  PaginationQueryDto,
  paginate,
} from '../common/dto/pagination-query.dto';
import { ListUsersDto, UpdateUserDto } from './dto/admin-queries.dto';

// Statuses that count as realized revenue (paid and not reversed).
const REVENUE_STATUSES = [
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export interface PlatformAnalytics {
  gmv: number;
  commissionEarned: number;
  commissionPercent: number;
  totalOrders: number;
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  revenueChart: { date: string; revenue: number }[];
  topStores: { storeId: string; name: string; revenue: number }[];
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Store)
    private readonly storesRepo: Repository<Store>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    private readonly usersService: UsersService,
    private readonly storesService: StoresService,
    private readonly productsService: ProductsService,
    private readonly settingsService: SettingsService,
  ) {}

  // --- Users ---

  async listUsers(dto: ListUsersDto) {
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.store', 'store')
      .orderBy('u.createdAt', 'DESC')
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit);
    if (dto.q) {
      qb.andWhere('(u.name ILIKE :q OR u.email ILIKE :q)', { q: `%${dto.q}%` });
    }
    if (dto.role) {
      qb.andWhere('u.role = :role', { role: dto.role });
    }
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, dto.page, dto.limit);
  }

  async updateUser(
    adminId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<User> {
    if (id === adminId) {
      throw new BadRequestException('You cannot modify your own admin account');
    }
    const user = await this.usersService.findByIdOrFail(id);
    const patch: Partial<User> = {};
    if (dto.role !== undefined) {
      patch.role = dto.role;
    }
    if (dto.isBanned !== undefined) {
      patch.isBanned = dto.isBanned;
    }
    if (Object.keys(patch).length === 0) {
      return user;
    }
    return this.usersService.update(id, patch);
  }

  // --- Stores / seller approval ---

  async listStores(dto: PaginationQueryDto) {
    const [data, total] = await this.storesRepo.findAndCount({
      relations: { owner: true },
      order: { createdAt: 'DESC' },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });
    return paginate(data, total, dto.page, dto.limit);
  }

  approveStore(storeId: string, isApproved: boolean): Promise<Store> {
    return this.storesService.setApproval(storeId, isApproved);
  }

  // --- Products ---

  listProducts(query: QueryProductDto) {
    return this.productsService.findAll({ ...query, includeInactive: true });
  }

  removeProduct(id: string): Promise<{ deleted: true }> {
    return this.productsService.remove(id, {
      id: 'admin',
      email: '',
      role: Role.ADMIN,
    });
  }

  async setProductStatus(id: string, status: ProductStatus): Promise<Product> {
    return this.productsService.update(id, { status });
  }

  // --- Orders ---

  async listOrders(dto: PaginationQueryDto) {
    const [data, total] = await this.ordersRepo.findAndCount({
      relations: { items: { product: { store: true } }, buyer: true },
      order: { createdAt: 'DESC' },
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
    });
    return paginate(data, total, dto.page, dto.limit);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    order.status = status;
    return this.ordersRepo.save(order);
  }

  // --- Settings ---

  async getCommission(): Promise<{ percent: number }> {
    return { percent: await this.settingsService.getCommissionPercent() };
  }

  async setCommission(percent: number): Promise<{ percent: number }> {
    const setting = await this.settingsService.setCommissionPercent(percent);
    return { percent: setting.commissionPercent };
  }

  // --- Analytics ---

  async getAnalytics(): Promise<PlatformAnalytics> {
    const totalsRaw = await this.ordersRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total), 0)', 'gmv')
      .addSelect('COUNT(*)', 'orders')
      .where('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .getRawOne<{ gmv: string; orders: string }>();

    const chartRaw = await this.ordersRepo
      .createQueryBuilder('o')
      .select("TO_CHAR(DATE_TRUNC('day', o.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(o.total), 0)', 'revenue')
      .where('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .andWhere("o.createdAt >= NOW() - INTERVAL '30 days'")
      .groupBy("DATE_TRUNC('day', o.createdAt)")
      .orderBy("DATE_TRUNC('day', o.createdAt)", 'ASC')
      .getRawMany<{ date: string; revenue: string }>();

    const topRaw = await this.orderItemsRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .innerJoin('p.store', 'store')
      .select('store.id', 'storeId')
      .addSelect('store.name', 'name')
      .addSelect('SUM(oi.price * oi.quantity)', 'revenue')
      .where('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .groupBy('store.id')
      .addGroupBy('store.name')
      .orderBy('SUM(oi.price * oi.quantity)', 'DESC')
      .limit(5)
      .getRawMany<{ storeId: string; name: string; revenue: string }>();

    const commissionPercent = await this.settingsService.getCommissionPercent();
    const gmv = Number(totalsRaw?.gmv ?? 0);

    const [totalUsers, totalSellers, totalProducts] = await Promise.all([
      this.usersRepo.count(),
      this.usersRepo.count({ where: { role: Role.SELLER } }),
      this.productsRepo.count(),
    ]);

    return {
      gmv,
      commissionEarned: Number(((gmv * commissionPercent) / 100).toFixed(2)),
      commissionPercent,
      totalOrders: Number(totalsRaw?.orders ?? 0),
      totalUsers,
      totalSellers,
      totalProducts,
      revenueChart: chartRaw.map((r) => ({
        date: r.date,
        revenue: Number(r.revenue),
      })),
      topStores: topRaw.map((r) => ({
        storeId: r.storeId,
        name: r.name,
        revenue: Number(r.revenue),
      })),
    };
  }
}
