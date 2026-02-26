import { Router, type IRouter } from 'express';
import { compressionController } from './compression.controller';
import { requireAuth, optionalAuth } from '../../middleware/auth.middleware';
import { uploadSingle, uploadBatch } from '../../middleware/upload.middleware';

const router: IRouter = Router();

// Public (optional auth for quota tracking)
router.post('/', optionalAuth, uploadSingle, compressionController.upload);
router.get('/:jobId', compressionController.getStatus);
router.get('/:jobId/download', compressionController.download);
router.get('/:jobId/preview', compressionController.preview);

// Batch
router.post('/batch', optionalAuth, uploadBatch, compressionController.batchUpload);
router.get('/batch/:batchId/zip', compressionController.batchZip);

// Protected
router.get('/history', requireAuth, compressionController.history);

export default router;
