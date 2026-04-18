// ============================================================
// DATABASE CONNECTION — MongoDB via Mongoose
// ============================================================

import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<void> {
  try {
    let uri = config.mongodb.uri;

    // Spin up an in-memory MongoDB if the user hasn't provided a real cloud URI
    // This makes the app instantly runnable locally without installing MongoDB!
    if (uri.includes('localhost') || uri === '') {
      logger.info('Spinning up zero-config in-memory MongoDB Server for local dev...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      logger.info(`✅ In-memory MongoDB running at ${uri}`);
    }

    await mongoose.connect(uri);
    logger.info('✅ Mongoose connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection failed', { error: (error as Error).message });
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    logger.info('In-memory MongoDB stopped');
  }
  logger.info('MongoDB disconnected cleanly');
}
