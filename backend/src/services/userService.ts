import bcrypt from 'bcrypt';
import { pool } from '../config/postgre';
import { User } from '../types/task';
import { generateToken } from '../middleware/auth';

const SALT_ROUNDS = 12;

export class UserService {
  static async register(username: string, email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>, token: string }> {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, email, preferred_language, timezone, created_at, updated_at`,
      [username, email, passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    return { user, token };
  }

  static async login(usernameOrEmail: string, password: string): Promise<{ user: Omit<User, 'password_hash'>, token: string }> {
    // Find user by username or email
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [usernameOrEmail]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  static async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const result = await pool.query(
      'SELECT id, username, email, preferred_language, timezone, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    return result.rows[0] || null;
  }

  static async updateUser(userId: string, updates: Partial<Pick<User, 'username' | 'email' | 'preferred_language' | 'timezone'>>): Promise<Omit<User, 'password_hash'>> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      throw new Error('No valid updates provided');
    }

    values.push(userId);
    const result = await pool.query(
      `UPDATE users SET ${setClause.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramIndex} 
       RETURNING id, username, email, preferred_language, timezone, created_at, updated_at`,
      values
    );

    return result.rows[0];
  }
}
