import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

export const initRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;  
  }
};

export { redisClient };