import { Router, type IRouter } from 'express';
import express from 'express';
import { billingController } from './billing.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router: IRouter = Router();

// Razorpay webhook needs raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), billingController.webhook);

router.get('/plans', billingController.getPlans);

router.use(requireAuth);
router.post('/subscription',        billingController.createSubscription);
router.post('/subscription/verify', billingController.verifyPayment);
router.delete('/subscription',      billingController.cancelSubscription);
router.get('/subscription/status',  billingController.getSubscription);

export default router;
