import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../config/env';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

function getRazorpay(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay not configured');
  }
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

export const billingService = {
  /** Step 1: create a Razorpay subscription and return details for the frontend checkout. */
  async createSubscription(userId: string, userEmail: string) {
    const razorpay = getRazorpay();
    if (!env.RAZORPAY_PLAN_ID) throw new Error('Razorpay plan ID not configured');

    const subscription = await razorpay.subscriptions.create({
      plan_id: env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12,  // 12 monthly billing cycles
      notes: { userId, userEmail },
    });

    return {
      subscriptionId: subscription.id,
      keyId: env.RAZORPAY_KEY_ID as string,
    };
  },

  /** Step 2: verify the payment signature after the Razorpay modal succeeds. */
  async verifyPayment(payload: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
    userId: string;
  }) {
    const expectedSig = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
      .update(`${payload.razorpay_payment_id}|${payload.razorpay_subscription_id}`)
      .digest('hex');

    if (expectedSig !== payload.razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    const razorpay = getRazorpay();
    const sub = await razorpay.subscriptions.fetch(payload.razorpay_subscription_id);
    // current_end is the unix timestamp of the current billing period end
    const periodEnd = sub.current_end ? new Date((sub.current_end as number) * 1000) : null;

    await prisma.$transaction([
      prisma.user.update({ where: { id: payload.userId }, data: { tier: 'PRO' } }),
      prisma.subscription.upsert({
        where: { userId: payload.userId },
        create: {
          userId: payload.userId,
          razorpaySubId: payload.razorpay_subscription_id,
          razorpayPlanId: env.RAZORPAY_PLAN_ID ?? '',
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
        },
        update: {
          razorpaySubId: payload.razorpay_subscription_id,
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
        },
      }),
      prisma.payment.create({
        data: {
          userId: payload.userId,
          razorpayPaymentId: payload.razorpay_payment_id,
          amount: 0,    // amount will be updated by webhook
          currency: 'inr',
          status: 'captured',
          description: 'Pro Plan subscription',
        },
      }),
    ]);

    return { success: true };
  },

  /** Cancel a subscription at the end of the current period. */
  async cancelSubscription(userId: string) {
    const razorpay = getRazorpay();
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub?.razorpaySubId) throw new Error('No active subscription found');

    await razorpay.subscriptions.cancel(sub.razorpaySubId, true);
    await prisma.subscription.update({ where: { userId }, data: { cancelAtEnd: true } });
    return { success: true };
  },

  /** Handle Razorpay webhook events (signed with HMAC-SHA256). */
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) throw new Error('Webhook secret not configured');

    const expectedSig = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSig !== signature) throw new Error('Invalid webhook signature');

    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      payload: {
        subscription?: { entity: Record<string, unknown> };
        payment?:      { entity: Record<string, unknown> };
      };
    };

    logger.info(`Razorpay webhook: ${event.event}`);

    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const sub = event.payload.subscription?.entity ?? {};
        const userId = (sub['notes'] as Record<string, string>)?.userId;
        if (!userId) break;

        const periodEnd = sub['current_end']
          ? new Date((sub['current_end'] as number) * 1000)
          : null;

        await prisma.$transaction([
          prisma.user.update({ where: { id: userId }, data: { tier: 'PRO' } }),
          prisma.subscription.upsert({
            where:  { userId },
            create: {
              userId,
              razorpaySubId:  sub['id'] as string,
              razorpayPlanId: sub['plan_id'] as string,
              status:         'ACTIVE',
              currentPeriodEnd: periodEnd,
            },
            update: { status: 'ACTIVE', currentPeriodEnd: periodEnd },
          }),
        ]);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        const subId = event.payload.subscription?.entity?.['id'] as string | undefined;
        if (!subId) break;
        const dbSub = await prisma.subscription.findUnique({ where: { razorpaySubId: subId } });
        if (!dbSub) break;

        await prisma.$transaction([
          prisma.subscription.update({ where: { id: dbSub.id }, data: { status: 'CANCELED' } }),
          prisma.user.update({ where: { id: dbSub.userId }, data: { tier: 'FREE' } }),
        ]);
        break;
      }

      case 'subscription.pending': {
        const subId = event.payload.subscription?.entity?.['id'] as string | undefined;
        if (!subId) break;
        await prisma.subscription.update({
          where: { razorpaySubId: subId },
          data:  { status: 'PAST_DUE' },
        });
        break;
      }
    }
  },
};
