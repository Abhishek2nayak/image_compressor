import fs from 'fs/promises';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { getStorage } from '../config/storage';
import { env } from '../config/env';

export async function cleanupExpiredJobs() {
  const expired = await prisma.compressionJob.findMany({
    where: { expiresAt: { lt: new Date() } },
    select: { id: true, storagePath: true, outputPath: true },
  });

  for (const job of expired) {
    // outputPath: local path for 'local' driver, storage key for cloud drivers
    if (job.outputPath) {
      if (env.STORAGE_DRIVER !== 'local') {
        await getStorage().delete(job.outputPath).catch(() => {});
      } else {
        await fs.unlink(job.outputPath).catch(() => {});
      }
    }

    // storagePath is always local (original multer temp file)
    if (job.storagePath) {
      await fs.unlink(job.storagePath).catch(() => {});
    }
  }

  if (expired.length > 0) {
    await prisma.compressionJob.deleteMany({
      where: { id: { in: expired.map((j) => j.id) } },
    });
    logger.info(`Cleaned up ${expired.length} expired compression jobs`);
  }
}
