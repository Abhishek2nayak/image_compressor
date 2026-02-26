import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from './error.middleware';

interface JwtPayload {
  userId: string;
  type: 'access' | 'refresh';
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (payload.type !== 'access') {
      return next(new AppError('Invalid token type', 401, 'INVALID_TOKEN'));
    }

    prisma.user
      .findUnique({ where: { id: payload.userId } })
      .then((user) => {
        if (!user) return next(new AppError('User not found', 401, 'USER_NOT_FOUND'));
        req.user = user;
        next();
      })
      .catch(next);
  } catch {
    next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    prisma.user
      .findUnique({ where: { id: payload.userId } })
      .then((user) => {
        if (user) req.user = user;
        next();
      })
      .catch(() => next());
  } catch {
    next();
  }
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
