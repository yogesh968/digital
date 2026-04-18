// ============================================================
// SUBSCRIPTION SERVICE — Stripe integration lifecycle
// ============================================================

import Stripe from 'stripe';
import { ISubscriptionRepository, IUserRepository, ICharityContributionRepository } from '../repositories/interfaces';
import { ISubscription, SubscriptionPlan } from '../entities/types';
import { PrizePoolCalculator } from './PrizePoolCalculator';
import { config } from '../config';
import { NotFoundError, PaymentError, ConflictError } from '../errors/AppError';
import { logger } from '../config/logger';

export class SubscriptionService {
  private readonly stripe: Stripe;

  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly userRepo: IUserRepository,
    private readonly contributionRepo: ICharityContributionRepository
  ) {
    this.stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2023-10-16' });
  }

  async createCheckoutSession(userId: string, plan: SubscriptionPlan): Promise<string> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User');

    const existing = await this.subscriptionRepo.findByUserId(userId);
    if (existing?.status === 'active') throw new ConflictError('User already has an active subscription');

    const priceId = plan === 'monthly'
      ? config.stripe.monthlyPriceId
      : config.stripe.yearlyPriceId;

    if (!priceId) throw new PaymentError('Price ID not configured — please set STRIPE_*_PRICE_ID env vars');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${config.app.url}/dashboard?subscribed=true`,
      cancel_url: `${config.app.url}/pricing?cancelled=true`,
      metadata: { userId, plan },
    });

    logger.info(`Stripe checkout session created for user ${userId}, plan: ${plan}`);
    return session.url!;
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
    } catch (err) {
      throw new PaymentError(`Webhook signature verification failed: ${(err as Error).message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCancelled(sub);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentSucceeded(invoice);
        break;
      }
      default:
        logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const { userId, plan } = session.metadata ?? {};
    if (!userId || !plan) return;

    const stripeSub = await this.stripe.subscriptions.retrieve(session.subscription as string);

    await this.subscriptionRepo.create({
      userId,
      plan: plan as SubscriptionPlan,
      status: 'active',
      stripeSubscriptionId: stripeSub.id,
      stripeCustomerId: stripeSub.customer as string,
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    });

    // Record charity contribution
    const user = await this.userRepo.findById(userId);
    if (user?.charityId) {
      const subAmount = plan === 'monthly'
        ? config.stripe.monthlyPricePence / 100
        : config.stripe.yearlyPricePence / 100;
      const contribution = PrizePoolCalculator.calculateCharityContribution(subAmount, user.charityPercentage);
      const sub = await this.subscriptionRepo.findByUserId(userId);
      if (sub) {
        await this.contributionRepo.create({
          userId,
          charityId: user.charityId,
          subscriptionId: sub.id,
          amount: contribution,
          period: new Date(),
        });
      }
    }

    logger.info(`Subscription activated for user ${userId}`);
  }

  private async handleSubscriptionUpdated(stripeSub: Stripe.Subscription): Promise<void> {
    const sub = await this.subscriptionRepo.findByStripeId(stripeSub.id);
    if (!sub) return;
    await this.subscriptionRepo.update(sub.id, {
      status: stripeSub.status === 'active' ? 'active' : 'lapsed',
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    });
  }

  private async handleSubscriptionCancelled(stripeSub: Stripe.Subscription): Promise<void> {
    const sub = await this.subscriptionRepo.findByStripeId(stripeSub.id);
    if (!sub) return;
    await this.subscriptionRepo.update(sub.id, { status: 'cancelled' });
    logger.info(`Subscription cancelled: ${sub.id}`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const stripeSubId = (invoice as unknown as Record<string, unknown>)['subscription'] as string;
    if (!stripeSubId) return;
    const sub = await this.subscriptionRepo.findByStripeId(stripeSubId);
    if (!sub || sub.status === 'active') return;
    await this.subscriptionRepo.update(sub.id, { status: 'active' });
    logger.info(`Subscription renewed: ${sub.id}`);
  }

  async getSubscription(userId: string): Promise<ISubscription | null> {
    return this.subscriptionRepo.findByUserId(userId);
  }

  async cancelSubscription(userId: string): Promise<void> {
    const sub = await this.subscriptionRepo.findByUserId(userId);
    if (!sub || sub.status !== 'active') throw new NotFoundError('Active subscription');
    if (sub.stripeSubscriptionId) {
      await this.stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    }
    await this.subscriptionRepo.update(sub.id, { status: 'cancelled' });
    logger.info(`Subscription cancelled by user ${userId}`);
  }
}
