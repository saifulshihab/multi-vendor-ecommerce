import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStatus } from '../common/enums';
import { StoresService } from '../stores/stores.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepo: Repository<Review>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    private readonly storesService: StoresService,
  ) {}

  /** Public list of reviews for a product, newest first, with author name. */
  findForProduct(productId: string): Promise<Review[]> {
    return this.reviewsRepo.find({
      where: { productId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * A buyer may review a product only after they have an order containing it
   * that has been delivered, and only once per product.
   */
  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    const product = await this.productsRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.reviewsRepo.findOne({
      where: { userId, productId: dto.productId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    const delivered = await this.ordersRepo
      .createQueryBuilder('o')
      .innerJoin('o.items', 'oi')
      .where('o.buyerId = :userId', { userId })
      .andWhere('oi.productId = :productId', { productId: dto.productId })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
      .getExists();
    if (!delivered) {
      throw new BadRequestException(
        'You can only review a product from a delivered order',
      );
    }

    const review = this.reviewsRepo.create({
      userId,
      productId: dto.productId,
      rating: dto.rating,
      comment: dto.comment,
    });
    const saved = await this.reviewsRepo.save(review);
    return this.reviewsRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { user: true },
    });
  }

  /** The store owner of the reviewed product may add a single reply. */
  async reply(
    sellerId: string,
    reviewId: string,
    reply: string,
  ): Promise<Review> {
    const review = await this.reviewsRepo.findOne({
      where: { id: reviewId },
      relations: { product: true, user: true },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    const store = await this.storesService.getMine(sellerId);
    if (review.product.storeId !== store.id) {
      throw new ForbiddenException('This review is not for your product');
    }
    review.reply = reply;
    return this.reviewsRepo.save(review);
  }
}
