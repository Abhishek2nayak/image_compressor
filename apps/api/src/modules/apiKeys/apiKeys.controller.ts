import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
});

function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `ic_${crypto.randomBytes(32).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const prefix = raw.slice(0, 10);
  return { raw, hash, prefix };
}

export const apiKeysController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, prefix: true, name: true, lastUsedAt: true,
          rateLimit: true, isActive: true, createdAt: true,
        },
      });
      res.json({ success: true, data: keys });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = createKeySchema.parse(req.body);
      const { raw, hash, prefix } = generateApiKey();

      const existing = await prisma.apiKey.count({ where: { userId: req.user!.id, isActive: true } });
      if (existing >= 10) {
        return next(new AppError('Maximum 10 active API keys allowed', 400, 'MAX_KEYS_REACHED'));
      }

      const key = await prisma.apiKey.create({
        data: { userId: req.user!.id, keyHash: hash, prefix, name },
      });

      // Return raw key ONCE — not stored in DB
      res.status(201).json({
        success: true,
        data: {
          id: key.id, prefix: key.prefix, name: key.name,
          key: raw, // shown only on creation
          rateLimit: key.rateLimit, createdAt: key.createdAt,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(new AppError(err.errors[0]?.message ?? 'Validation error', 400, 'VALIDATION_ERROR'));
      }
      next(err);
    }
  },

  async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const key = await prisma.apiKey.findFirst({ where: { id, userId: req.user!.id } });
      if (!key) return next(new AppError('API key not found', 404, 'NOT_FOUND'));

      await prisma.apiKey.update({ where: { id }, data: { isActive: false } });
      res.json({ success: true, message: 'API key revoked' });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const { name } = z.object({ name: z.string().min(1).max(100) }).parse(req.body);

      const key = await prisma.apiKey.findFirst({ where: { id, userId: req.user!.id } });
      if (!key) return next(new AppError('API key not found', 404, 'NOT_FOUND'));

      const updated = await prisma.apiKey.update({
        where: { id },
        data: { name },
        select: { id: true, prefix: true, name: true, rateLimit: true, isActive: true, createdAt: true },
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(new AppError(err.errors[0]?.message ?? 'Validation error', 400, 'VALIDATION_ERROR'));
      }
      next(err);
    }
  },
};
