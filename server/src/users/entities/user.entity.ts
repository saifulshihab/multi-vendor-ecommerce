import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums';
import { Store } from '../../stores/entities/store.entity';
import { Order } from '../../orders/entities/order.entity';
import { Review } from '../../reviews/entities/review.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Role, default: Role.BUYER })
  role: Role;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  emailVerificationToken: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  passwordResetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  passwordResetExpiresAt: Date | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  refreshTokenHash: string | null;

  @OneToOne(() => Store, (store) => store.owner)
  store: Store;

  @OneToMany(() => Order, (order) => order.buyer)
  orders: Order[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => CartItem, (item) => item.user)
  cartItems: CartItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
