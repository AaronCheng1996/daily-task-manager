import { Pool } from 'pg';
import dotenv from 'dotenv';
import Env from './env';
import logger from '../lib/log/logger';

dotenv.config();

const pool = new Pool({
  connectionString: Env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const initPostgre = async () => {
  try {
    const client = await pool.connect();
    logger.info('Connected to PostgreSQL');
    client.release();
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export { pool };
