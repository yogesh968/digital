// ============================================================
// SERVER ENTRY POINT
// ============================================================

import { createApp } from './app';
import { config } from './config';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { seedDatabase } from './utils/seed';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Seed initial required charities if none exist
    await seedDatabase();

    // 3. Start Express server
    const app = createApp();
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Golf Charity API running on port ${config.port} [${config.env}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('Server closed');
      });
      await disconnectDatabase();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

startServer();
