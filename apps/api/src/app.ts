import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { env } from './config/env';
import { globalRateLimiter } from './middleware/rateLimiter.middleware';
import { errorMiddleware } from './middleware/error.middleware';

import authRoutes from './modules/auth/auth.routes';
import compressionRoutes from './modules/compression/compression.routes';
import userRoutes from './modules/user/user.routes';
import apiKeyRoutes from './modules/apiKeys/apiKeys.routes';
import billingRoutes from './modules/billing/billing.routes';

const app: express.Application = express();

// Security
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing (billing webhook uses express.raw — mounted first in billing routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Passport
app.use(passport.initialize());

// Rate limiting
app.use(globalRateLimiter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/compress', compressionRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);
app.use('/api/v1/billing', billingRoutes);

// 404
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// Error handler
app.use(errorMiddleware);

export default app;
