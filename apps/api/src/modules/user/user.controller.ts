import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { TIER_LIMITS } from '@image-compressor/shared';
import { Tier } from '@prisma/client';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(100).optional(),
});

export const userController = {
  async getProfile(req: Request, res: Response) {
    const user = req.user!;
    res.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, tier: user.tier, createdAt: user.createdAt },
    });
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const body = updateProfileSchema.parse(req.body);
      const updates: { name?: string; passwordHash?: string } = {};

      if (body.name !== undefined) updates.name = body.name;

      if (body.newPassword) {
        if (!body.currentPassword) {
          return next(new AppError('Current password required to change password', 400, 'MISSING_CURRENT_PASSWORD'));
        }
        if (!user.passwordHash) {
          return next(new AppError('OAuth accounts cannot set a password here', 400, 'OAUTH_ACCOUNT'));
        }
        const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
        if (!valid) return next(new AppError('Current password is incorrect', 401, 'WRONG_PASSWORD'));
        updates.passwordHash = await bcrypt.hash(body.newPassword, 12);
      }

      const updated = await prisma.user.update({ where: { id: user.id }, data: updates });
      res.json({ success: true, data: { id: updated.id, email: updated.email, name: updated.name, tier: updated.tier } });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(new AppError(err.errors[0]?.message ?? 'Validation error', 400, 'VALIDATION_ERROR'));
      }
      next(err);
    }
  },

  async getUsage(req: Request, res: Response) {
    const user = req.user!;
    const limit = TIER_LIMITS[user.tier as Tier].dailyUploads;

    const totalJobs = await prisma.compressionJob.count({ where: { userId: user.id, status: 'DONE' } });
    const totalBytesSaved = await prisma.compressionJob.aggregate({
      where: { userId: user.id, status: 'DONE' },
      _sum: { compressedSize: true },
    });

    const savedBytes = totalBytesSaved._sum.compressedSize ?? 0;

    res.json({
      success: true,
      data: {
        dailyUploads: user.dailyUploads,
        dailyLimit: limit === Infinity ? -1 : limit,
        totalJobs,
        totalBytesSaved: savedBytes,
        resetAt: user.dailyResetAt,
      },
    });
  },

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      await prisma.user.delete({ where: { id: user.id } });
      res.json({ success: true, message: 'Account deleted' });
    } catch (err) {
      next(err);
    }
  },
};
