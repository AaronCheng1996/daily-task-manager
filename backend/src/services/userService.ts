import bcrypt from 'bcrypt';
import { ulid } from 'ulid';
import { prisma } from '../utils/prisma';
import { User } from '../models/user';
import { generateToken } from '../utils/auth';

const SALT_ROUNDS = 12;

export class UserService {
  static async register(username: string, email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>, token: string }> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userId = ulid();
    const user = await prisma.user.create({
      data: {
        id: userId,
        username,
        email,
        password_hash: passwordHash
      },
      select: {
        id: true,
        username: true,
        email: true,
        preferred_language: true,
        points: true,
        timezone: true,
        created_at: true,
        updated_at: true
      }
    });

    const token = generateToken(user.id);
    return { user, token };
  }

  static async login(usernameOrEmail: string, password: string): Promise<{ user: Omit<User, 'password_hash'>, token: string }> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user.id);

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  static async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        preferred_language: true,
        points: true,
        timezone: true,
        created_at: true,
        updated_at: true
      }
    });

    return user;
  }

  static async updateUser(userId: string, updates: Partial<Pick<User, 'username' | 'email' | 'preferred_language' | 'timezone'>>): Promise<Omit<User, 'password_hash'>> {
    const validUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: validUpdates,
      select: {
        id: true,
        username: true,
        email: true,
        preferred_language: true,
        points: true,
        timezone: true,
        created_at: true,
        updated_at: true
      }
    });

    return user;
  }
}
