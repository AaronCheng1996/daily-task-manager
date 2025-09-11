import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { User } from '../models/user';
import Env from '../config/env';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const jwtSecret = Env.JWT_SECRET;
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }
};

export const generateToken = (userId: string): string => {
  const jwtSecret = Env.JWT_SECRET;
  const expiresIn = Env.JWT_EXPIRES_IN;
  
  return jwt.sign({ userId }, jwtSecret, {
    expiresIn
  } as jwt.SignOptions);
};
