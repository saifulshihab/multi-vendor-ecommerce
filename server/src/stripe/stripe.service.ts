import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null;
  private readonly webhookSecret: string;
  private readonly feePercent: number;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('stripe.secretKey');
    this.webhookSecret = this.config.get<string>('stripe.webhookSecret') ?? '';
    this.feePercent =
      this.config.get<number>('stripe.platformFeePercent') ?? 10;
    this.client = secretKey ? new Stripe(secretKey) : null;
    if (!this.client) {
      this.logger.warn(
        'STRIPE_SECRET_KEY not set — Stripe features run in no-op/disabled mode.',
      );
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  /** Throws a clear error if a Stripe call is attempted without configuration. */
  private require(): Stripe {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Stripe is not configured on the server.',
      );
    }
    return this.client;
  }

  /** Platform commission in basis-point-free percent (e.g. 10 = 10%). */
  get platformFeePercent(): number {
    return this.feePercent;
  }

  /**
   * Creates a Stripe Connect Express account for a seller. Returns null (instead
   * of throwing) when Stripe is unconfigured, so seller onboarding still works
   * locally before keys are added.
   */
  async createConnectAccount(email: string): Promise<string | null> {
    if (!this.client) {
      this.logger.warn(
        `Skipping Connect account creation for ${email} (Stripe disabled).`,
      );
      return null;
    }
    const account = await this.client.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    return account.id;
  }

  /** Hosted onboarding link the seller follows to finish KYC/payout setup. */
  async createAccountOnboardingLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ): Promise<string> {
    const stripe = this.require();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return link.url;
  }

  async getAccount(accountId: string): Promise<Stripe.Account> {
    return this.require().accounts.retrieve(accountId);
  }

  async listPayouts(accountId: string, limit = 20): Promise<Stripe.Payout[]> {
    if (!this.client) return [];
    const payouts = await this.client.payouts.list(
      { limit },
      { stripeAccount: accountId },
    );
    return payouts.data;
  }

  /**
   * Creates a Checkout Session. Funds collect on the platform account; per-seller
   * payouts happen afterward via createTransfer (separate charges & transfers),
   * which supports a multi-seller cart in a single session.
   */
  createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
  ): Promise<Stripe.Checkout.Session> {
    return this.require().checkout.sessions.create(params);
  }

  /** Resolves the charge id behind a completed session (for source_transaction). */
  async getChargeIdForSession(paymentIntentId: string): Promise<string | null> {
    if (!this.client) return null;
    const pi = await this.client.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    });
    const charge = pi.latest_charge;
    if (!charge) return null;
    return typeof charge === 'string' ? charge : charge.id;
  }

  /** Transfers funds from the platform balance to a seller's connected account. */
  async createTransfer(params: {
    amount: number;
    destination: string;
    transferGroup: string;
    sourceTransaction?: string;
  }): Promise<Stripe.Transfer | null> {
    if (!this.client) return null;
    return this.client.transfers.create({
      amount: params.amount,
      currency: 'usd',
      destination: params.destination,
      transfer_group: params.transferGroup,
      source_transaction: params.sourceTransaction,
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const stripe = this.require();
    if (!this.webhookSecret) {
      throw new ServiceUnavailableException(
        'STRIPE_WEBHOOK_SECRET is not configured.',
      );
    }
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
  }
}
