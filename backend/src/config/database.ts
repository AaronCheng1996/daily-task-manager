import { Pool } from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Redis connection  
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Initialize connections
export const initDatabase = async () => {
  try {
    // Test PostgreSQL connection
    const client = await pool.connect();
    console.log('Connected to PostgreSQL');
    client.release();

    // Connect to Redis
    await redisClient.connect();
    
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export { pool, redisClient };
