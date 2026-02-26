import { Router, type IRouter } from 'express';
import { apiKeysController } from './apiKeys.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router: IRouter = Router();

router.use(requireAuth);
router.get('/', apiKeysController.list);
router.post('/', apiKeysController.create);
router.delete('/:id', apiKeysController.revoke);
router.patch('/:id', apiKeysController.update);

export default router;
