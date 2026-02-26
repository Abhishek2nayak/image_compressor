import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { AppError } from './error.middleware';

export async function apiKeyAuth(req: Request, _res: Response, next: NextFunction) {
  const rawKey = req.headers['x-api-key'] as string | undefined;
  if (!rawKey) {
    return next(new AppError('API key required', 401, 'API_KEY_REQUIRED'));
  }

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKey || !apiKey.isActive) {
    return next(new AppError('Invalid or inactive API key', 401, 'INVALID_API_KEY'));
  }

  // Rate limit check via Redis sliding window
  const windowKey = `ratelimit:apikey:${apiKey.id}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour

  const pipe = redis.pipeline();
  pipe.zadd(windowKey, now, `${now}-${Math.random()}`);
  pipe.zremrangebyscore(windowKey, 0, now - windowMs);
  pipe.zcard(windowKey);
  pipe.expire(windowKey, 3600);
  const results = await pipe.exec();

  const count = (results?.[2]?.[1] as number) ?? 0;

  if (count > apiKey.rateLimit) {
    return next(new AppError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED'));
  }

  // Update lastUsedAt (fire and forget)
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  req.user = apiKey.user;
  next();
}
