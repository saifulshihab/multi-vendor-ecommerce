import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CartService } from '../cart/cart.service';
import { StripeService } from '../stripe/stripe.service';
import { ProductStatus } from '../common/enums';
import { CreateCheckoutSessionDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly cartService: CartService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  async createSession(
    userId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ url: string; sessionId: string }> {
    const cart = await this.cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.items.map((item) => {
        const product = item.product;
        if (product.status !== ProductStatus.ACTIVE) {
          throw new BadRequestException(
            `"${product.title}" is no longer available`,
          );
        }
        if (item.quantity > product.stock) {
          throw new BadRequestException(
            `Only ${product.stock} unit(s) of "${product.title}" in stock`,
          );
        }
        return {
          quantity: item.quantity,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(Number(product.price) * 100),
            product_data: {
              name: product.title,
              images: product.images?.slice(0, 1),
              metadata: { productId: product.id, storeId: product.storeId },
            },
          },
        };
      });

    const frontendUrl = this.config.get<string>('frontendUrl');
    const successUrl =
      dto.successUrl ??
      `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = dto.cancelUrl ?? `${frontendUrl}/cart`;

    const session = await this.stripeService.createCheckoutSession({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
      payment_intent_data: { metadata: { userId } },
    });

    return { url: session.url ?? '', sessionId: session.id };
  }
}
