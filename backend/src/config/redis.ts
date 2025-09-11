import { createClient } from 'redis';
import dotenv from 'dotenv';
import Env from './env';
import logger from '../lib/log/logger';

dotenv.config();

const redisClient = createClient({
    url: Env.REDIS_URL,
});

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});
redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

export const initRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;  
  }
};

export { redisClient };