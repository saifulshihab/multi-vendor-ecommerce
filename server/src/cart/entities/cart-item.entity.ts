import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
@Unique(['userId', 'productId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.cartItems)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @Column()
  productId: string;

  @Column()
  quantity: number;
}
