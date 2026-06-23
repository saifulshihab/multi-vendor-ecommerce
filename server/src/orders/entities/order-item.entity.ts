import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (o) => o.items)
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => Product, (p) => p.orderItems)
  product: Product;

  @Column()
  productId: string;

  @Column()
  quantity: number;

  // price snapshot at time of purchase — never reference live product price
  @Column('decimal', { precision: 10, scale: 2 })
  price: string;

  @Column()
  storeId: string; // for seller order filtering
}
