import { Router, type IRouter } from 'express';
import express from 'express';
import { billingController } from './billing.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router: IRouter = Router();

// Stripe webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), billingController.webhook);

router.get('/plans', billingController.getPlans);
router.use(requireAuth);
router.post('/checkout', billingController.createCheckout);
router.post('/portal', billingController.createPortal);
router.get('/subscription', billingController.getSubscription);

export default router;
