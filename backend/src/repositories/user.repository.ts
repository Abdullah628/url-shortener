import { pool } from '../config/database';
import { User, CreateUserDto } from '../types';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, email, password_hash, url_count, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows. length === 0) return null;

    return this.mapToUser(result.rows[0]);
  }

  async findByEmail(email:  string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, email, password_hash, url_count, created_at, updated_at
       FROM users WHERE email = $1`,
      [email. toLowerCase()]
    );

    if (result.rows.length === 0) return null;

    return this.mapToUser(result.rows[0]);
  }

  async create(dto: CreateUserDto & { passwordHash: string }): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, password_hash, url_count, created_at, updated_at`,
      [dto.email. toLowerCase(), dto.passwordHash]
    );

    return this. mapToUser(result.rows[0]);
  }

  async updateUrlCount(userId: string, increment: number): Promise<void> {
    await pool.query(
      `UPDATE users SET url_count = url_count + $1 WHERE id = $2`,
      [increment, userId]
    );
  }

  async getUrlCount(userId:  string): Promise<number> {
    const result = await pool. query(
      `SELECT url_count FROM users WHERE id = $1`,
      [userId]
    );

    return result.rows[0]?.url_count ??  0;
  }

  async emailExists(email: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM users WHERE email = $1 LIMIT 1`,
      [email. toLowerCase()]
    );

    return result. rows. length > 0;
  }

  private mapToUser(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      email: row.email as string,
      passwordHash: row.password_hash as string,
      urlCount:  row.url_count as number,
      createdAt: row. created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }
}

export const userRepository = new UserRepository();