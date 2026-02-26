import { Request, Response, NextFunction } from 'express';
import { billingService } from './billing.service';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    interval: null,
    features: ['10 uploads/day', '25MB max file size', 'JPG, PNG, WebP, AVIF', 'Basic compression'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1200,
    currency: 'usd',
    interval: 'month',
    features: ['500 uploads/day', '25MB max file size', 'All formats', 'Batch processing', 'API access (500 req/hr)', 'Priority support'],
  },
];

export const billingController = {
  async getPlans(_req: Request, res: Response) {
    res.json({ success: true, data: PLANS });
  },

  async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await billingService.createCheckoutSession(user.id, user.email);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async createPortal(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await billingService.createPortalSession(req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;
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
