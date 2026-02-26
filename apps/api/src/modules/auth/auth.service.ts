import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../middleware/auth.middleware';

export interface RegisterInput {
  email: string;
  name?: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authService = {
  async register({ email, name, password }: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already in use', 409, 'EMAIL_IN_USE');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
    });

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name, tier: user.tier },
      accessToken,
      refreshToken,
    };
  },

  async login({ email, password }: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name, tier: user.tier },
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new AppError('User not found', 401, 'USER_NOT_FOUND');

    const newAccessToken = signAccessToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async findOrCreateGoogleUser(profile: { id: string; email: string; name?: string }) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.id }, { email: profile.email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email: profile.email, name: profile.name, googleId: profile.id },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id },
      });
    }

    return user;
  },
};
