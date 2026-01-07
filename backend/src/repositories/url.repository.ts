
import { pool } from '../config/database';
import { Url, PaginationParams, PaginatedResult } from '../types';

export class UrlRepository {
  async findById(id: string): Promise<Url | null> {
    const result = await pool.query(
      `SELECT id, user_id, short_code, original_url, click_count, 
              is_active, expires_at, created_at, updated_at
       FROM urls WHERE id = $1`,
      [id]
    );

    if (result.rows. length === 0) return null;

    return this.mapToUrl(result.rows[0]);
  }

  async findByShortCode(shortCode: string): Promise<Url | null> {
    const result = await pool. query(
      `SELECT id, user_id, short_code, original_url, click_count, 
              is_active, expires_at, created_at, updated_at
       FROM urls WHERE short_code = $1`,
      [shortCode]
    );

    if (result.rows.length === 0) return null;

    return this.mapToUrl(result.rows[0]);
  }

  async findByUserIdPaginated(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Url>> {
    const offset = (pagination.page - 1) * pagination.limit;

    // Get total count
    const countResult = await pool. query(
      'SELECT COUNT(*)::integer as total FROM urls WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    const total = countResult.rows[0].total;

    // Get paginated data
    const result = await pool.query(
      `SELECT id, user_id, short_code, original_url, click_count, 
              is_active, expires_at, created_at, updated_at
       FROM urls 
       WHERE user_id = $1 AND is_active = true
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pagination.limit, offset]
    );

    return {
      data: result.rows. map((row) => this.mapToUrl(row)),
      pagination: {
        page:  pagination.page,
        limit: pagination. limit,
        total,
        totalPages: Math.ceil(total / pagination. limit),
      },
    };
  }

  async create(data: {
    userId: string;
    shortCode: string;
    originalUrl:  string;
  }): Promise<Url> {
    const result = await pool.query(
      `INSERT INTO urls (user_id, short_code, original_url)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, short_code, original_url, click_count, 
                 is_active, expires_at, created_at, updated_at`,
      [data.userId, data.shortCode, data.originalUrl]
    );

    return this.mapToUrl(result. rows[0]);
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE urls 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND is_active = true
       RETURNING id`,
      [id, userId]
    );

    return result. rows. length > 0;
  }

  async hardDelete(id: string, userId:  string): Promise<{ deleted: boolean; shortCode:  string | null }> {
    const result = await pool.query(
      `DELETE FROM urls 
       WHERE id = $1 AND user_id = $2
       RETURNING short_code`,
      [id, userId]
    );

    return {
      deleted: result.rows. length > 0,
      shortCode:  result.rows[0]?.short_code || null,
    };
  }

  async incrementClickCount(id:  string): Promise<void> {
    await pool.query(
      'UPDATE urls SET click_count = click_count + 1 WHERE id = $1',
      [id]
    );
  }

  async batchIncrementClickCount(urlIds: string[]): Promise<void> {
    if (urlIds.length === 0) return;

    // Count occurrences of each URL ID
    const counts = urlIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Update each URL with its click count
    const client = await pool.connect();
    try {
      await client. query('BEGIN');

      for (const [urlId, count] of Object.entries(counts)) {
        await client.query(
          'UPDATE urls SET click_count = click_count + $1 WHERE id = $2',
          [count, urlId]
        );
      }

      await client. query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*)::integer as count FROM urls WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    return result.rows[0].count;
  }

  async existsByShortCode(shortCode: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM urls WHERE short_code = $1 LIMIT 1',
      [shortCode]
    );

    return result.rows. length > 0;
  }

  private mapToUrl(row: Record<string, unknown>): Url {
    return {
      id: row. id as string,
      userId: row.user_id as string,
      shortCode: row.short_code as string,
      originalUrl: row.original_url as string,
      clickCount:  parseInt(row.click_count as string, 10) || 0,
      isActive: row.is_active as boolean,
      expiresAt: row.expires_at as Date | null,
      createdAt: row. created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }
}

// Singleton instance
export const urlRepository = new UrlRepository();