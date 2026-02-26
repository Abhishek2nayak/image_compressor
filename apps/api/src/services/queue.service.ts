import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export interface CompressionJobData {
  jobId: string;
  storagePath: string;
  mimeType: string;
  quality: number; // 1–100, higher = better quality / larger file
}

export const compressionQueue = new Queue<CompressionJobData>('compression', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
