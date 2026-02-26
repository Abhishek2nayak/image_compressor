import { Worker } from 'bullmq';
import path from 'path';
import fs from 'fs/promises';
import { redis } from '../../config/redis';
import { prisma } from '../../config/database';
import { compressImage } from './compression.service';
import { CompressionJobData } from '../../services/queue.service';
import { logger } from '../../utils/logger';
import { getStorage } from '../../config/storage';
import { env } from '../../config/env';

export function startCompressionWorker() {
  const worker = new Worker<CompressionJobData>(
    'compression',
    async (job) => {
      const { jobId, storagePath, mimeType, quality } = job.data;
      logger.info(`Processing job ${jobId} at quality ${quality}`);

      await prisma.compressionJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      });

      const { outputPath: localOutputPath, compressedSize } = await compressImage(storagePath, mimeType, quality);

      // For cloud drivers: upload to storage, delete local temp files
      let finalOutputPath = localOutputPath;
      if (env.STORAGE_DRIVER !== 'local') {
        const ext = path.extname(localOutputPath);
        const storageKey = `compressed/${jobId}${ext}`;
        finalOutputPath = await getStorage().save(localOutputPath, storageKey);
        await fs.unlink(storagePath).catch(() => {});
        await fs.unlink(localOutputPath).catch(() => {});
      }

      await prisma.compressionJob.update({
        where: { id: jobId },
        data: {
          status: 'DONE',
          outputPath: finalOutputPath,
          compressedSize,
          completedAt: new Date(),
        },
      });

      logger.info(`Job ${jobId} done. Compressed to ${compressedSize} bytes`);
    },
    { connection: redis, concurrency: 4 },
  );

  worker.on('failed', async (job, err) => {
    if (job) {
      logger.error(`Job ${job.data.jobId} failed`, err);
      await prisma.compressionJob
        .update({ where: { id: job.data.jobId }, data: { status: 'FAILED', errorMessage: err.message } })
        .catch(() => {});
    }
  });

  logger.info('🔧 Compression worker started');
  return worker;
}
