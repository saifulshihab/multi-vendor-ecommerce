import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('mail.from')!;
    this.frontendUrl = this.config.get<string>('frontendUrl')!;
    const user = this.config.get<string>('mail.user');
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.host'),
      port: this.config.get<number>('mail.port'),
      secure: false,
      auth: user
        ? { user, pass: this.config.get<string>('mail.password') }
        : undefined,
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Sent "${subject}" to ${to}`);
    } catch (err) {
      // Don't let a mail outage break the request flow; log and continue.
      this.logger.warn(
        `Failed to send "${subject}" to ${to}: ${(err as Error).message}`,
      );
    }
  }

  sendEmailVerification(to: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/auth/verify-email?token=${token}`;
    return this.send(
      to,
      'Verify your email',
      `<p>Welcome! Confirm your email by clicking <a href="${url}">this link</a>.</p>
       <p>Or use this token: <code>${token}</code></p>`,
    );
  }

  sendPasswordReset(to: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/auth/reset-password?token=${token}`;
    return this.send(
      to,
      'Reset your password',
      `<p>Reset your password with <a href="${url}">this link</a> (valid for 1 hour).</p>
       <p>Or use this token: <code>${token}</code></p>`,
    );
  }

  sendOrderConfirmation(
    to: string,
    orderId: string,
    total: string,
  ): Promise<void> {
    const url = `${this.frontendUrl}/buyer/orders/${orderId}`;
    return this.send(
      to,
      `Order confirmed (#${orderId.slice(0, 8)})`,
      `<p>Thanks for your order! Total: <strong>$${total}</strong>.</p>
       <p>Track it <a href="${url}">here</a>.</p>`,
    );
  }

  sendNewOrderToSeller(
    to: string,
    orderId: string,
    itemCount: number,
  ): Promise<void> {
    const url = `${this.frontendUrl}/seller/orders`;
    return this.send(
      to,
      `New order received (#${orderId.slice(0, 8)})`,
      `<p>You have a new order with ${itemCount} item(s).</p>
       <p>View it in your <a href="${url}">seller dashboard</a>.</p>`,
    );
  }
}
