// ============================================================
// EXPRESS APP — middleware configuration (no routes here)
// ============================================================

import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { router } from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { config } from './config';
import { logger } from './config/logger';

export const createApp = (): Application => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }));

  // Stripe webhook needs raw body — must be before json() parser
  app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }));

  // Request logging
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg: string) => logger.http(msg.trim()) },
  }));

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static files (Winner Proofs)
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  // Root health check
  app.get('/', (_req, res) => res.json({ status: 'Golf Charity API running' }));

  // API routes
  app.use('/api/v1', router);

  // 404
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

// Vercel requires a default export of the Express app instance
import { connectDatabase } from './config/database';
import { seedDatabase } from './utils/seed';

const app = createApp();

connectDatabase().then(() => seedDatabase()).catch(() => {});

export default app;
