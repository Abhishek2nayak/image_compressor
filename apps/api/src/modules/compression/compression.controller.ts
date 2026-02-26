import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { compressionQueue } from '../../services/queue.service';
import { AppError } from '../../middleware/error.middleware';
import { streamZipToResponse } from '../../utils/zip';
import { TIER_LIMITS } from '@image-compressor/shared';
import { Tier } from '@prisma/client';
import { qualityToLevel } from './compression.service';
import { getStorage } from '../../config/storage';
import { env } from '../../config/env';

// quality: 1–100 (higher = better quality, less compression)
const qualitySchema = z.coerce.number().min(1).max(100).default(75);

async function sendFile(
  res: Response,
  next: NextFunction,
  outputPath: string,
  mimeType: string,
  disposition: string,
  cacheControl?: string,
) {
  if (env.STORAGE_DRIVER !== 'local') {
    try {
      const buffer = await getStorage().getBuffer(outputPath);
      res.setHeader('Content-Type', mimeType);
      if (cacheControl) res.setHeader('Cache-Control', cacheControl);
      res.setHeader('Content-Disposition', disposition);
      return res.end(buffer);
    } catch {
      return next(new AppError('File expired or deleted', 410, 'FILE_EXPIRED'));
    }
  }
  if (!fs.existsSync(outputPath)) {
    return next(new AppError('File expired or deleted', 410, 'FILE_EXPIRED'));
  }
  res.setHeader('Content-Type', mimeType);
  if (cacheControl) res.setHeader('Cache-Control', cacheControl);
  res.setHeader('Content-Disposition', disposition);
  fs.createReadStream(outputPath).pipe(res);
}

function getExpiresAt(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  return d;
}

export const compressionController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) return next(new AppError('No file uploaded', 400, 'NO_FILE'));

      const quality = qualitySchema.parse(req.body['quality']);
      const user = req.user;

      // Quota check
      if (user) {
        const now = new Date();
        const needsReset = user.dailyResetAt < new Date(now.setHours(0, 0, 0, 0));
        if (needsReset) {
          await prisma.user.update({
            where: { id: user.id },
            data: { dailyUploads: 0, dailyResetAt: new Date() },
          });
          user.dailyUploads = 0;
        }
        const limit = TIER_LIMITS[user.tier as Tier].dailyUploads;
        if (user.dailyUploads >= limit) {
          return next(new AppError('Daily upload quota exceeded. Upgrade to Pro for more.', 429, 'QUOTA_EXCEEDED'));
        }
        await prisma.user.update({ where: { id: user.id }, data: { dailyUploads: { increment: 1 } } });
      }

      const job = await prisma.compressionJob.create({
        data: {
          userId: user?.id ?? null,
          status: 'PENDING',
          originalName: file.originalname,
          originalSize: file.size,
          mimeType: file.mimetype,
          level: qualityToLevel(quality),
          storagePath: file.path,
          expiresAt: getExpiresAt(),
        },
      });

      await compressionQueue.add('compress', {
        jobId: job.id,
        storagePath: file.path,
        mimeType: file.mimetype,
        quality,
      });

      res.status(202).json({ success: true, data: { jobId: job.id, status: 'PENDING' } });
    } catch (err) {
      next(err);
    }
  },

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params as { jobId: string };
      const job = await prisma.compressionJob.findUnique({ where: { id: jobId } });
      if (!job) return next(new AppError('Job not found', 404, 'JOB_NOT_FOUND'));

      const savingsPercent =
        job.compressedSize && job.originalSize > 0
          ? Math.round(((job.originalSize - job.compressedSize) / job.originalSize) * 100)
          : 0;

      res.json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
          originalName: job.originalName,
          originalSize: job.originalSize,
          compressedSize: job.compressedSize,
          savingsPercent,
          mimeType: job.mimeType,
          level: job.level,
          errorMessage: job.errorMessage,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params as { jobId: string };
      const job = await prisma.compressionJob.findUnique({ where: { id: jobId } });

      if (!job) return next(new AppError('Job not found', 404, 'JOB_NOT_FOUND'));
      if (job.status !== 'DONE' || !job.outputPath) {
        return next(new AppError('File not ready yet', 400, 'NOT_READY'));
      }

      const ext = path.extname(job.originalName);
      const baseName = path.basename(job.originalName, ext);
      await sendFile(res, next, job.outputPath, job.mimeType, `attachment; filename="${baseName}_compressed${ext}"`);
    } catch (err) {
      next(err);
    }
  },

  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params as { jobId: string };
      const job = await prisma.compressionJob.findUnique({ where: { id: jobId } });
      if (!job || job.status !== 'DONE' || !job.outputPath) {
        return next(new AppError('Preview not available', 404, 'NOT_READY'));
      }
      await sendFile(res, next, job.outputPath, job.mimeType, 'inline', 'public, max-age=3600');
    } catch (err) {
      next(err);
    }
  },

  async batchUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return next(new AppError('No files uploaded', 400, 'NO_FILES'));

      const quality = qualitySchema.parse(req.body['quality']);
      const batchId = uuidv4();
      const user = req.user;

      const jobs = await Promise.all(
        files.map(async (file) => {
          const job = await prisma.compressionJob.create({
            data: {
              userId: user?.id ?? null,
              batchId,
              status: 'PENDING',
              originalName: file.originalname,
              originalSize: file.size,
              mimeType: file.mimetype,
              level: qualityToLevel(quality),
              storagePath: file.path,
              expiresAt: getExpiresAt(),
            },
          });

          await compressionQueue.add('compress', {
            jobId: job.id,
            storagePath: file.path,
            mimeType: file.mimetype,
            quality,
          });

          return { jobId: job.id, originalName: file.originalname, status: 'PENDING' };
        }),
      );

      res.status(202).json({ success: true, data: { batchId, jobs } });
    } catch (err) {
      next(err);
    }
  },

  async batchZip(req: Request, res: Response, next: NextFunction) {
    try {
      const { batchId } = req.params as { batchId: string };
      const jobs = await prisma.compressionJob.findMany({
        where: { batchId, status: 'DONE' },
      });

      if (jobs.length === 0) {
        return next(new AppError('No completed jobs in batch', 404, 'BATCH_NOT_READY'));
      }

      const files = jobs
        .filter((j) => j.outputPath && fs.existsSync(j.outputPath))
        .map((j) => {
          const ext = path.extname(j.originalName);
          const base = path.basename(j.originalName, ext);
          return { filePath: j.outputPath!, archiveName: `${base}_compressed${ext}` };
        });

      streamZipToResponse(res, files, `compressed_batch_${batchId}.zip`);
    } catch (err) {
      next(err);
    }
  },

  async history(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const page = Math.max(1, parseInt((req.query['page'] as string) ?? '1'));
      const pageSize = Math.min(50, parseInt((req.query['pageSize'] as string) ?? '20'));

      const [jobs, total] = await Promise.all([
        prisma.compressionJob.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true, status: true, originalName: true, originalSize: true,
            compressedSize: true, level: true, createdAt: true, completedAt: true,
          },
        }),
        prisma.compressionJob.count({ where: { userId: user.id } }),
      ]);

      res.json({
        success: true,
        data: { items: jobs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  },
};
