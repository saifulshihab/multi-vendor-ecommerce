import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({ nullable: true })
  stripeAccountId: string;

  @Column({ default: false })
  isApproved: boolean;

  @OneToOne(() => User, (user) => user.store)
  @JoinColumn()
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Product, (product) => product.store)
  products: Product[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
