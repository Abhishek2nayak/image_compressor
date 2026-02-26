import './config/env'; // validate env first
import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { startCompressionWorker } from './modules/compression/compression.worker';
import { logger } from './utils/logger';
import cron from 'node-cron';
import { cleanupExpiredJobs } from './jobs/cleanup.job';

async function bootstrap() {
  // Test DB connection
  await prisma.$connect();
  logger.info('✅ Database connected');

  // Test Redis connection
  await redis.ping();

  // Start BullMQ worker
  startCompressionWorker();

  // Cron: cleanup expired files every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running cleanup job...');
    await cleanupExpiredJobs();
  });

  // Cron: reset daily upload counts at midnight UTC
  cron.schedule('0 0 * * *', async () => {
    logger.info('Resetting daily upload counts...');
    await prisma.user.updateMany({ data: { dailyUploads: 0, dailyResetAt: new Date() } });
  });

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API server running at http://localhost:${env.PORT}`);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down...');
    server.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      process.exit(0);
    });
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
