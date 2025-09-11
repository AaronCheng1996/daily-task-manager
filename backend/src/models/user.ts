import type { User as UserBase } from '../generated/prisma';

export type User = UserBase & {
  password_hash: string;
};