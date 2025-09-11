// Database configuration using Prisma
import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

export const initDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export { prisma };
