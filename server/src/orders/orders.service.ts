import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Stripe from 'stripe';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { OrderStatus, ProductStatus } from '../common/enums';
import { StripeService } from '../stripe/stripe.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { PaginatedResult, paginate } from '../common/dto/pagination-query.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Store)
    private readonly storesRepo: Repository<Store>,
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Creates an order from a completed Stripe Checkout Session. Order, its items,
   * and stock decrements happen in a single transaction. Idempotent on the
   * session id so webhook retries don't double-create.
   */
  async createFromCheckoutSession(
    session: Stripe.Checkout.Session,
  ): Promise<Order | null> {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.warn('Checkout session missing userId metadata; skipping.');
      return null;
    }

    const existing = await this.ordersRepo.findOne({
      where: { stripeSessionId: session.id },
    });
    if (existing) {
      return existing; // already processed
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let orderId: string;
    try {
      const manager = queryRunner.manager;
      const cartItems = await manager.find(CartItem, {
        where: { userId },
        relations: { product: true },
      });
      if (cartItems.length === 0) {
        await queryRunner.commitTransaction();
        return null;
      }

      let totalCents = 0;
      const order = manager.create(Order, {
        buyerId: userId,
        status: OrderStatus.PROCESSING,
        total: '0.00',
        stripeSessionId: session.id,
      });
      await manager.save(order);
      orderId = order.id;

      for (const cartItem of cartItems) {
        const product = cartItem.product;
        const priceCents = Math.round(Number(product.price) * 100);
        totalCents += priceCents * cartItem.quantity;

        const orderItem = manager.create(OrderItem, {
          orderId: order.id,
          productId: product.id,
          quantity: cartItem.quantity,
          price: Number(product.price).toFixed(2),
          storeId: product.storeId,
        });
        await manager.save(orderItem);

        const nextStock = Math.max(0, product.stock - cartItem.quantity);
        product.stock = nextStock;
        if (nextStock === 0) {
          product.status = ProductStatus.OUT_OF_STOCK;
        }
        await manager.save(Product, product);
      }

      order.total = (totalCents / 100).toFixed(2);
      await manager.save(order);
      await manager.delete(CartItem, { userId });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Order creation failed for session ${session.id}: ${(err as Error).message}`,
      );
      throw err;
    } finally {
      await queryRunner.release();
    }

    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: { items: true },
    });
    if (order) {
      await this.payoutSellers(order, session);
      await this.sendOrderEmails(order, userId);
    }
    return order;
  }

  /** Separate transfers: pay each seller their subtotal minus platform commission. */
  private async payoutSellers(
    order: Order,
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    if (!this.stripeService.isConfigured) return;
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

    try {
      const sourceTransaction = paymentIntentId
        ? ((await this.stripeService.getChargeIdForSession(paymentIntentId)) ??
          undefined)
        : undefined;

      const feePercent = this.stripeService.platformFeePercent;
      const byStore = new Map<string, number>();
      for (const item of order.items) {
        const cents = Math.round(Number(item.price) * 100) * item.quantity;
        byStore.set(item.storeId, (byStore.get(item.storeId) ?? 0) + cents);
      }

      for (const [storeId, grossCents] of byStore) {
        const store = await this.storesRepo.findOne({
          where: { id: storeId },
        });
        if (!store?.stripeAccountId) continue;
        const payoutCents = Math.round((grossCents * (100 - feePercent)) / 100);
        if (payoutCents <= 0) continue;
        await this.stripeService.createTransfer({
          amount: payoutCents,
          destination: store.stripeAccountId,
          transferGroup: order.id,
          sourceTransaction,
        });
      }
    } catch (err) {
      // Never fail order processing because a transfer failed; log for ops.
      this.logger.error(
        `Seller payout failed for order ${order.id}: ${(err as Error).message}`,
      );
    }
  }

  private async sendOrderEmails(order: Order, buyerId: string): Promise<void> {
    const buyer = await this.usersService.findById(buyerId);
    if (buyer) {
      await this.mailService.sendOrderConfirmation(
        buyer.email,
        order.id,
        order.total,
      );
    }
    const storeIds = [...new Set(order.items.map((i) => i.storeId))];
    for (const storeId of storeIds) {
      const store = await this.storesRepo.findOne({
        where: { id: storeId },
        relations: { owner: true },
      });
      if (store?.owner?.email) {
        const itemCount = order.items.filter(
          (i) => i.storeId === storeId,
        ).length;
        await this.mailService.sendNewOrderToSeller(
          store.owner.email,
          order.id,
          itemCount,
        );
      }
    }
  }

  async findForBuyer(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Order>> {
    const [data, total] = await this.ordersRepo.findAndCount({
      where: { buyerId: userId },
      relations: { items: { product: true } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async findOneForBuyer(userId: string, orderId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, buyerId: userId },
      relations: { items: { product: true } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
