import Stripe from 'stripe';
import { env } from '../../config/env';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export const billingService = {
  async createCheckoutSession(userId: string, userEmail: string) {
    const stripe = getStripe();
    if (!env.STRIPE_PRO_PRICE_ID) throw new Error('Pro price ID not configured');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: userEmail,
      line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/dashboard?upgraded=true`,
      cancel_url: `${env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: { userId },
    });

    return { url: session.url };
  },

  async createPortalSession(userId: string) {
    const stripe = getStripe();
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub?.stripeCustomerId) throw new Error('No active subscription found');

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}/dashboard`,
    });

    return { url: session.url };
  },

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = getStripe();
    if (!env.STRIPE_WEBHOOK_SECRET) throw new Error('Webhook secret not configured');

    const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    logger.info(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.['userId'];
        if (!userId || !session.subscription || !session.customer) break;

        await prisma.$transaction([
          prisma.user.update({ where: { id: userId }, data: { tier: 'PRO' } }),
          prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubId: session.subscription as string,
              stripePriceId: env.STRIPE_PRO_PRICE_ID ?? '',
              status: 'ACTIVE',
            },
            update: {
              stripeCustomerId: session.customer as string,
              stripeSubId: session.subscription as string,
              status: 'ACTIVE',
            },
          }),
        ]);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const dbSub = await prisma.subscription.findUnique({ where: { stripeSubId: sub.id } });
        if (!dbSub) break;

        const status = sub.status === 'active' ? 'ACTIVE'
          : sub.status === 'past_due' ? 'PAST_DUE'
          : sub.status === 'canceled' ? 'CANCELED'
          : 'CANCELED';

        await prisma.$transaction([
          prisma.subscription.update({
            where: { stripeSubId: sub.id },
            data: {
              status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtEnd: sub.cancel_at_period_end,
            },
          }),
          ...(status === 'CANCELED'
            ? [prisma.user.update({ where: { id: dbSub.userId }, data: { tier: 'FREE' } })]
            : []),
        ]);
        break;
      }
    }
  },
};
