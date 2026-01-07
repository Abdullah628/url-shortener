import crypto from 'crypto';
import { pool } from '../config/database';
import { cacheService } from './cache.service';
import { ShortCodePoolStats } from '../types';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export class ShortCodeService {
  /**
   * Get an available short code from the pre-generated pool
   * Uses PostgreSQL's FOR UPDATE SKIP LOCKED for concurrent safety
   */
  async getShortCode(): Promise<string> {
    const client = await pool.connect();

    try {
      // Use the atomic function we created in schema
      const result = await client.query('SELECT get_available_short_code() as code');
      const code = result.rows[0]?.code;

      if (!code) {
        // Pool exhausted - fallback to generate on-the-fly with collision check
        console.warn('⚠️ Short code pool exhausted!  Using fallback generation.');
        return await this.generateWithCollisionCheck();
      }

      return code;
    } finally {
      client.release();
    }
  }

  /**
   * Release a short code back to the pool (on URL deletion)
   * This allows recycling of codes for efficiency
   */
  async releaseShortCode(code: string): Promise<void> {
    await pool.query('SELECT release_short_code($1)', [code]);
  }

  /**
   * Get pool statistics for monitoring
   */
  async getPoolStats(): Promise<ShortCodePoolStats> {
    // Check cache first
    const cachedStats = await cacheService.getPoolStats();
    if (cachedStats) {
      return cachedStats;
    }

    const result = await pool.query(`
      SELECT 
        COUNT(*)::integer as total,
        COUNT(*) FILTER (WHERE is_used = TRUE)::integer as used,
        COUNT(*) FILTER (WHERE is_used = FALSE)::integer as available
      FROM short_code_pool
    `);

    const stats: ShortCodePoolStats = {
      total: result. rows[0]. total,
      used: result.rows[0].used,
      available: result. rows[0].available,
    };

    // Cache the stats
    await cacheService.setPoolStats(stats);

    return stats;
  }

  /**
   * Check if pool needs replenishment
   */
  async needsReplenishment(threshold: number = 10000): Promise<boolean> {
    const stats = await this.getPoolStats();
    return stats. available < threshold;
  }

  /**
   * Fallback:  Generate code with collision checking
   * Only used when pool is exhausted
   */
  private async generateWithCollisionCheck(): Promise<string> {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = this.generateRandomCode();

      // Check if code exists in urls table
      const exists = await pool.query(
        'SELECT 1 FROM urls WHERE short_code = $1',
        [code]
      );

      if (exists.rows.length === 0) {
        return code;
      }
    }

    throw new AppError(
      'Failed to generate unique short code.  Please try again.',
      503,
      'SHORT_CODE_GENERATION_FAILED'
    );
  }

  /**
   * Generate a random short code
   */
  private generateRandomCode(): string {
    const length = env.SHORT_CODE_LENGTH;
    let code = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      code += CHARACTERS[randomBytes[i]!  % CHARACTERS.length];
    }

    return code;
  }
}

// Singleton instance
export const shortCodeService = new ShortCodeService();