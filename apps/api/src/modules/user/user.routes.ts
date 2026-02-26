import { Router, type IRouter } from 'express';
import { userController } from './user.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router: IRouter = Router();

router.use(requireAuth);
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.get('/usage', userController.getUsage);
router.delete('/account', userController.deleteAccount);

export default router;
