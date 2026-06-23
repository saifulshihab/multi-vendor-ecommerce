import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductStatus } from '../common/enums';

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: string;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async getCart(userId: string): Promise<CartSummary> {
    const items = await this.cartRepo.find({
      where: { userId },
      order: { id: 'ASC' },
    });
    return this.summarize(items);
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartSummary> {
    const product = await this.assertPurchasable(productId);

    let item = await this.cartRepo.findOne({
      where: { userId, productId },
    });
    const nextQty = (item?.quantity ?? 0) + quantity;
    this.assertStock(product, nextQty);

    if (item) {
      item.quantity = nextQty;
    } else {
      item = this.cartRepo.create({ userId, productId, quantity });
    }
    await this.cartRepo.save(item);
    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartSummary> {
    const item = await this.cartRepo.findOne({ where: { id: itemId, userId } });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    const product = await this.assertPurchasable(item.productId);
    this.assertStock(product, quantity);
    item.quantity = quantity;
    await this.cartRepo.save(item);
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartSummary> {
    const item = await this.cartRepo.findOne({ where: { id: itemId, userId } });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    await this.cartRepo.remove(item);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepo.delete({ userId });
  }

  private async assertPurchasable(productId: string): Promise<Product> {
    const product = await this.productsRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Product is not available for purchase');
    }
    return product;
  }

  private assertStock(product: Product, quantity: number): void {
    if (quantity > product.stock) {
      throw new BadRequestException(
        `Only ${product.stock} unit(s) of "${product.title}" in stock`,
      );
    }
  }

  private summarize(items: CartItem[]): CartSummary {
    const subtotalCents = items.reduce((sum, item) => {
      const priceCents = Math.round(Number(item.product.price) * 100);
      return sum + priceCents * item.quantity;
    }, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      items,
      itemCount,
      subtotal: (subtotalCents / 100).toFixed(2),
    };
  }
}
