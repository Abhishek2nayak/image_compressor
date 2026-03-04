import { Router, type IRouter } from 'express';
import { toolUsageController } from './toolUsage.controller';
import { optionalAuth } from '../../middleware/auth.middleware';

const router: IRouter = Router();

// optionalAuth attaches req.user if a valid JWT is present, but doesn't block guests
router.post('/check',  optionalAuth, toolUsageController.check);
router.post('/record', optionalAuth, toolUsageController.record);

export default router;
