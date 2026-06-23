import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UsersService } from '../users/users.service';
import { StripeService } from '../stripe/stripe.service';
import { uniqueSlug } from '../common/utils/slug.util';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepo: Repository<Store>,
    private readonly usersService: UsersService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  async create(ownerId: string, dto: CreateStoreDto): Promise<Store> {
    const existing = await this.storesRepo.findOne({ where: { ownerId } });
    if (existing) {
      throw new ConflictException('You already have a store');
    }
    const owner = await this.usersService.findByIdOrFail(ownerId);

    const slug = await uniqueSlug(dto.name, async (candidate) => {
      const count = await this.storesRepo.count({ where: { slug: candidate } });
      return count > 0;
    });

    // Provision a Stripe Connect Express account (null when Stripe is disabled).
    const stripeAccountId = await this.stripeService.createConnectAccount(
      owner.email,
    );

    const store = this.storesRepo.create({
      ...dto,
      slug,
      ownerId,
      stripeAccountId: stripeAccountId ?? undefined,
    });
    return this.storesRepo.save(store);
  }

  async findBySlug(slug: string): Promise<Store> {
    const store = await this.storesRepo.findOne({ where: { slug } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  findByOwnerId(ownerId: string): Promise<Store | null> {
    return this.storesRepo.findOne({ where: { ownerId } });
  }

  async getMine(ownerId: string): Promise<Store> {
    const store = await this.findByOwnerId(ownerId);
    if (!store) {
      throw new NotFoundException('You have not created a store yet');
    }
    return store;
  }

  async updateMine(ownerId: string, dto: UpdateStoreDto): Promise<Store> {
    const store = await this.getMine(ownerId);
    Object.assign(store, dto);
    return this.storesRepo.save(store);
  }

  /**
   * Returns a hosted Stripe onboarding link for the seller, creating the
   * Connect account first if it doesn't exist yet.
   */
  async getOnboardingLink(ownerId: string): Promise<{ url: string }> {
    const store = await this.getMine(ownerId);
    if (!store.stripeAccountId) {
      const owner = await this.usersService.findByIdOrFail(ownerId);
      const accountId = await this.stripeService.createConnectAccount(
        owner.email,
      );
      if (!accountId) {
        throw new NotFoundException('Stripe is not configured');
      }
      store.stripeAccountId = accountId;
      await this.storesRepo.save(store);
    }
    const frontendUrl = this.config.get<string>('frontendUrl');
    const url = await this.stripeService.createAccountOnboardingLink(
      store.stripeAccountId,
      `${frontendUrl}/seller/onboarding?refresh=1`,
      `${frontendUrl}/seller/dashboard`,
    );
    return { url };
  }

  async getPayouts(ownerId: string): Promise<Stripe.Payout[]> {
    const store = await this.getMine(ownerId);
    if (!store.stripeAccountId) {
      return [];
    }
    return this.stripeService.listPayouts(store.stripeAccountId);
  }

  /** Admin: approve a seller's store so it can go live. */
  async setApproval(storeId: string, isApproved: boolean): Promise<Store> {
    const store = await this.storesRepo.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    store.isApproved = isApproved;
    return this.storesRepo.save(store);
  }
}
