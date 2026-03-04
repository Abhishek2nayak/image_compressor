import { Request, Response, NextFunction } from 'express';
import { billingService } from './billing.service';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'inr',
    interval: null,
    features: ['10 operations/day', '15 pages per operation', '10 MB max file size', 'All 4 tools', 'Browser-side processing'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99900,   // ₹999 in paise
    currency: 'inr',
    interval: 'month',
    features: ['Unlimited operations/day', '200 pages per operation', '100 MB max file size', 'All 4 tools', 'API access (500 req/hr)', 'Priority support'],
  },
];

export const billingController = {
  async getPlans(_req: Request, res: Response) {
    res.json({ success: true, data: PLANS });
  },

  /** Create a Razorpay subscription — returns subscriptionId + keyId for the frontend. */
  async createSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await billingService.createSubscription(user.id, user.email);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /** Verify payment signature after Razorpay modal closes successfully. */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body as {
        razorpay_payment_id: string;
        razorpay_subscription_id: string;
        razorpay_signature: string;
      };
      if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
        return next(new AppError('Missing payment fields', 400, 'MISSING_FIELDS'));
      }
      const result = await billingService.verifyPayment({
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
        userId: req.user!.id,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /** Cancel the active subscription at end of current period. */
  async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await billingService.cancelSubscription(req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /** Razorpay webhook — signature is in x-razorpay-signature header. */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      if (!signature) return next(new AppError('Missing signature', 400, 'MISSING_SIGNATURE'));
      await billingService.handleWebhook(req.body as Buffer, signature);
      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  },

  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await prisma.subscription.findUnique({ where: { userId: req.user!.id } });
      res.json({
        success: true,
        data: sub
          ? { status: sub.status, tier: req.user!.tier, currentPeriodEnd: sub.currentPeriodEnd, cancelAtEnd: sub.cancelAtEnd }
          : { status: null, tier: 'FREE', currentPeriodEnd: null, cancelAtEnd: false },
      });
    } catch (err) {
      next(err);
    }
  },
};
