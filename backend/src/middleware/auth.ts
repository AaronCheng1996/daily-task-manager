import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    // Get user from database
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }
};

export const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign({ userId }, jwtSecret, {
    expiresIn
  } as jwt.SignOptions);
};
