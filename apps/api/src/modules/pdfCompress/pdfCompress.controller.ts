import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { AppError } from '../../middleware/error.middleware';
import { toolUsageService } from '../toolUsage/toolUsage.service';
import { compressPdf, type CompressionLevel } from './pdfCompress.service';

function getIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown'
  );
}

export const pdfCompressController = {
  async compress(req: Request, res: Response, next: NextFunction) {
    const file = req.file;
    if (!file) return next(new AppError('No file uploaded', 400, 'NO_FILE'));

    try {
      const fileSizeMB = file.size / (1024 * 1024);

      // Quota check (enforces per-tier file size + daily operation limits)
      const check = await toolUsageService.check({
        userId: req.user?.id,
        ipAddress: getIp(req),
        fileSizeMB,
      });

      if (!check.allowed) {
        return next(new AppError(check.reason ?? 'Quota exceeded', 429, 'QUOTA_EXCEEDED'));
      }

      const rawLevel = (req.body as { level?: string }).level ?? 'medium';
      const level: CompressionLevel =
        rawLevel === 'low' || rawLevel === 'high' ? rawLevel : 'medium';

      // Compress
      const result = await compressPdf(file.path, level);

      // Record usage after success
      await toolUsageService.record({
        tool: 'compress-pdf',
        userId: req.user?.id,
        ipAddress: getIp(req),
        pageCount: result.pageCount,
        fileCount: 1,
      });

      const baseName = path.basename(file.originalname, path.extname(file.originalname));
      const savingsPercent =
        result.originalSize > 0
          ? Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100)
          : 0;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}_compressed.pdf"`);
      res.setHeader('X-Original-Size', result.originalSize.toString());
      res.setHeader('X-Compressed-Size', result.compressedSize.toString());
      res.setHeader('X-Savings-Percent', savingsPercent.toString());
      res.setHeader('X-Page-Count', result.pageCount.toString());
      res.end(result.buffer);
    } catch (err) {
      next(err);
    } finally {
      // Always remove the temp upload
      if (file) await fs.unlink(file.path).catch(() => {});
    }
  },
};
