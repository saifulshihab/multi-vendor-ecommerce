import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatus } from '../common/enums';
import { StoresService } from '../stores/stores.service';
import { ProductsService } from '../products/products.service';
import { QueryProductDto } from '../products/dto/query-product.dto';
import { DashboardRange } from './dto/seller-queries.dto';
import { PaginatedResult, paginate } from '../common/dto/pagination-query.dto';

// Statuses that count as realized revenue (paid and not reversed).
const REVENUE_STATUSES = [
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const RANGE_DAYS: Record<DashboardRange, number> = {
  [DashboardRange.D7]: 7,
  [DashboardRange.D30]: 30,
  [DashboardRange.D90]: 90,
};

export interface SellerDashboard {
  totalOrders: number;
  totalRevenue: number;
  totalProductsSold: number;
  revenueChart: { date: string; revenue: number }[];
  topProducts: {
    productId: string;
    title: string;
    quantity: number;
    revenue: number;
  }[];
}

@Injectable()
export class SellerService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    private readonly storesService: StoresService,
    private readonly productsService: ProductsService,
  ) {}

  private async storeId(sellerId: string): Promise<string> {
    const store = await this.storesService.getMine(sellerId);
    return store.id;
  }

  async getProducts(sellerId: string, query: QueryProductDto) {
    const storeId = await this.storeId(sellerId);
    return this.productsService.findForStore(storeId, query);
  }

  async getDashboard(
    sellerId: string,
    range: DashboardRange,
  ): Promise<SellerDashboard> {
    const storeId = await this.storeId(sellerId);
    const days = RANGE_DAYS[range];

    const totalsRaw = await this.orderItemsRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .select('COUNT(DISTINCT oi.orderId)', 'totalOrders')
      .addSelect('COALESCE(SUM(oi.price * oi.quantity), 0)', 'totalRevenue')
      .addSelect('COALESCE(SUM(oi.quantity), 0)', 'totalProductsSold')
      .where('oi.storeId = :storeId', { storeId })
      .andWhere('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .getRawOne<{
        totalOrders: string;
        totalRevenue: string;
        totalProductsSold: string;
      }>();

    const chartRaw = await this.orderItemsRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .select("TO_CHAR(DATE_TRUNC('day', o.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(oi.price * oi.quantity), 0)', 'revenue')
      .where('oi.storeId = :storeId', { storeId })
      .andWhere('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .andWhere("o.createdAt >= NOW() - (:days || ' days')::interval", { days })
      .groupBy("DATE_TRUNC('day', o.createdAt)")
      .orderBy("DATE_TRUNC('day', o.createdAt)", 'ASC')
      .getRawMany<{ date: string; revenue: string }>();

    const topRaw = await this.orderItemsRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .select('oi.productId', 'productId')
      .addSelect('p.title', 'title')
      .addSelect('SUM(oi.quantity)', 'quantity')
      .addSelect('SUM(oi.price * oi.quantity)', 'revenue')
      .where('oi.storeId = :storeId', { storeId })
      .andWhere('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .groupBy('oi.productId')
      .addGroupBy('p.title')
      .orderBy('SUM(oi.quantity)', 'DESC')
      .limit(5)
      .getRawMany<{
        productId: string;
        title: string;
        quantity: string;
        revenue: string;
      }>();

    return {
      totalOrders: Number(totalsRaw?.totalOrders ?? 0),
      totalRevenue: Number(totalsRaw?.totalRevenue ?? 0),
      totalProductsSold: Number(totalsRaw?.totalProductsSold ?? 0),
      revenueChart: chartRaw.map((r) => ({
        date: r.date,
        revenue: Number(r.revenue),
      })),
      topProducts: topRaw.map((r) => ({
        productId: r.productId,
        title: r.title,
        quantity: Number(r.quantity),
        revenue: Number(r.revenue),
      })),
    };
  }

  async getOrders(
    sellerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Order>> {
    const storeId = await this.storeId(sellerId);

    // Orders that contain at least one item from this seller's store.
    const idRows = await this.ordersRepo
      .createQueryBuilder('o')
      .innerJoin('o.items', 'oi')
      .where('oi.storeId = :storeId', { storeId })
      .select('o.id', 'id')
      .addSelect('o.createdAt', 'createdAt')
      .groupBy('o.id')
      .orderBy('o.createdAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ id: string }>();

    const totalRow = await this.ordersRepo
      .createQueryBuilder('o')
      .innerJoin('o.items', 'oi')
      .where('oi.storeId = :storeId', { storeId })
      .select('COUNT(DISTINCT o.id)', 'count')
      .getRawOne<{ count: string }>();
    const total = Number(totalRow?.count ?? 0);

    if (idRows.length === 0) {
      return paginate<Order>([], total, page, limit);
    }

    const ids = idRows.map((r) => r.id);
    const orders = await this.ordersRepo.find({
      where: { id: In(ids) },
      relations: { items: { product: true }, buyer: true },
      order: { createdAt: 'DESC' },
    });

    // Show only this seller's items within each order.
    for (const order of orders) {
      order.items = order.items.filter((i) => i.storeId === storeId);
    }
    return paginate(orders, total, page, limit);
  }

  async updateOrderStatus(
    sellerId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const storeId = await this.storeId(sellerId);
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const ownsItem = order.items.some((i) => i.storeId === storeId);
    if (!ownsItem) {
      throw new ForbiddenException('This order has no items from your store');
    }
    order.status = status;
    return this.ordersRepo.save(order);
  }
}
