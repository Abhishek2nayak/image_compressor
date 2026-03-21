import { Router, type IRouter } from 'express';
import { pdfCompressController } from './pdfCompress.controller';
import { optionalAuth } from '../../middleware/auth.middleware';
import { uploadPdf } from '../../middleware/pdfUpload.middleware';

const router: IRouter = Router();

// Public (optional auth for quota tracking)
router.post('/', optionalAuth, uploadPdf, pdfCompressController.compress);

export default router;
