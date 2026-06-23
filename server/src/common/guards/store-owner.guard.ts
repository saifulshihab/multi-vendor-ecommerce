import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Store } from '../../stores/entities/store.entity';
import { Role } from '../enums';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * For store-scoped product mutations: loads the product referenced by the `:id`
 * route param and asserts the authenticated seller owns its store. Admins pass
 * through. The loaded product is attached to the request as `req.product`.
 */
@Injectable()
export class StoreOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Store)
    private readonly storesRepo: Repository<Store>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params: Record<string, string>;
      product?: Product;
    }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const productId = request.params.id;
    const product = await this.productsRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    request.product = product;

    if (user.role === Role.ADMIN) {
      return true;
    }

    const store = await this.storesRepo.findOne({
      where: { id: product.storeId },
    });
    if (!store || store.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this product');
    }
    return true;
  }
}
