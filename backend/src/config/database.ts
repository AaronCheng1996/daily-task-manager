import logger from '../utils/logger';
import { prisma } from '../utils/prisma';

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

