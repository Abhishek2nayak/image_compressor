import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { AppError } from '../../middleware/error.middleware';
import { signAccessToken, signRefreshToken } from '../../middleware/auth.middleware';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const body = registerSchema.parse(req.body);
      const result = await authService.register(body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(new AppError(err.errors[0]?.message ?? 'Validation error', 400, 'VALIDATION_ERROR'));
      }
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = loginSchema.parse(req.body);
      const result = await authService.login(body);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(new AppError(err.errors[0]?.message ?? 'Validation error', 400, 'VALIDATION_ERROR'));
      }
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      if (!refreshToken) return next(new AppError('Refresh token required', 400, 'MISSING_TOKEN'));
      const result = await authService.refresh(refreshToken);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response) {
    const user = req.user!;
    res.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, tier: user.tier, createdAt: user.createdAt },
    });
  },

  async googleCallback(req: Request, res: Response) {
    const user = req.user!;
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  },

  async logout(_req: Request, res: Response) {
    // Stateless JWT — client simply discards tokens.
    // For a refresh token blacklist, store in Redis here.
    res.json({ success: true, message: 'Logged out' });
  },
};
