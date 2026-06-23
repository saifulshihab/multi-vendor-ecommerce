import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('reviews')
@Unique(['userId', 'productId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  rating: number; // 1–5

  @Column({ nullable: true })
  comment: string;

  @Column({ nullable: true })
  reply: string; // seller response

  @ManyToOne(() => User, (u) => u.reviews)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Product, (p) => p.reviews)
  product: Product;

  @Column()
  productId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
