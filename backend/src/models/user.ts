import { User as UserBase } from '../generated/prisma';

export interface User extends Omit<UserBase, 'password_hash'> {
  password_hash: string;
} 