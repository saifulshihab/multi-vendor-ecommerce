import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductStatus } from '../../common/enums';
import { Category } from '../../categories/entities/category.entity';
import { Store } from '../../stores/entities/store.entity';
import { Review } from '../../reviews/entities/review.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: string;

  @Column({ default: 0 })
  stock: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column('text', { array: true, default: '{}' })
  images: string[];

  @ManyToOne(() => Category, (c) => c.products, { eager: true })
  category: Category;

  @Column()
  categoryId: string;

  @ManyToOne(() => Store, (s) => s.products)
  store: Store;

  @Column()
  storeId: string;

  @OneToMany(() => Review, (r) => r.product)
  reviews: Review[];

  @OneToMany(() => OrderItem, (oi) => oi.product)
  orderItems: OrderItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
