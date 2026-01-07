import Redis from 'ioredis';
import { env } from '../config/env';
import { CachedUrl, ClickData, RateLimitResult, ShortCodePoolStats } from '../types';

export class CacheService {
  private redis: Redis;
  private readonly URL_PREFIX = 'url:';
  private readonly RATE_PREFIX = 'rate:';
  private readonly USER_LIMIT_PREFIX = 'user:limit:';
  private readonly CLICKS_BUFFER_KEY = 'clicks:buffer';
  private readonly CLICKS_COUNT_PREFIX = 'clicks:count:';
  private readonly POOL_STATS_KEY = 'stats:pool';

  constructor() {
    this.redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    this.redis.on('error', (err) => {
      console.error('Redis Cache Service Error:', err.message);
    });

    this.redis.on('connect', () => {
      console.log('✅ Cache Service: Redis connected');
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
  }

  // URL CACHING

  async getUrl(shortCode: string): Promise<CachedUrl | null> {
    try {
      const key = `${this.URL_PREFIX}${shortCode}`;
      const data = await this.redis.get(key);

      if (!data) return null;

      return JSON.parse(data) as CachedUrl;
    } catch (error) {
      console.error('Cache getUrl error:', error);
      return null;
    }
  }

  async setUrl(shortCode: string, data: CachedUrl): Promise<void> {
    try {
      const key = `${this.URL_PREFIX}${shortCode}`;
      await this.redis.setex(key, env.CACHE_URL_TTL, JSON.stringify(data));
    } catch (error) {
      console.error('Cache setUrl error:', error);
    }
  }

  async deleteUrl(shortCode: string): Promise<void> {
    try {
      const key = `${this.URL_PREFIX}${shortCode}`;
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache deleteUrl error:', error);
    }
  }

  // RATE LIMITING (Sliding Window Counter)

  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number = env.RATE_LIMIT_WINDOW_MS
  ): Promise<RateLimitResult> {
    try {
      const key = `${this.RATE_PREFIX}${identifier}`;
      const windowSec = Math.ceil(windowMs / 1000);

      const multi = this.redis.multi();
      multi.incr(key);
      multi.expire(key, windowSec);
      const results = await multi.exec();

      const current = (results?.[0] ? (results[0][1] as number) : 0) || 0;
      const ttl = await this.redis.ttl(key);

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime: Math.ceil(Date.now() / 1000) + (ttl > 0 ? ttl : windowSec),
      };
    } catch (error) {
      console.error('Cache checkRateLimit error:', error);
      // Fail open - allow request if Redis fails
      return { allowed: true, remaining: limit, resetTime: 0 };
    }
  }

  // USER URL COUNT (for limit checking)

  async getUserUrlCount(userId: string): Promise<number | null> {
    try {
      const key = `${this.USER_LIMIT_PREFIX}${userId}`;
      const count = await this.redis.get(key);
      return count ? parseInt(count, 10) : null;
    } catch (error) {
      console.error('Cache getUserUrlCount error:', error);
      return null;
    }
  }

  async setUserUrlCount(userId: string, count: number): Promise<void> {
    try {
      const key = `${this.USER_LIMIT_PREFIX}${userId}`;
      await this.redis.setex(key, env.CACHE_USER_LIMIT_TTL, count.toString());
    } catch (error) {
      console.error('Cache setUserUrlCount error:', error);
    }
  }

  async incrementUserUrlCount(userId: string): Promise<number> {
    try {
      const key = `${this.USER_LIMIT_PREFIX}${userId}`;
      const newCount = await this.redis.incr(key);

      // Set TTL if this is a new key
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        await this.redis.expire(key, env.CACHE_USER_LIMIT_TTL);
      }

      return newCount;
    } catch (error) {
      console.error('Cache incrementUserUrlCount error:', error);
      return 0;
    }
  }

  async decrementUserUrlCount(userId: string): Promise<void> {
    try {
      const key = `${this.USER_LIMIT_PREFIX}${userId}`;
      await this.redis.decr(key);
    } catch (error) {
      console.error('Cache decrementUserUrlCount error:', error);
    }
  }

  // CLICK TRACKING (Buffered for batch processing)

  async bufferClick(clickData: ClickData): Promise<void> {
    try {
      await this.redis.lpush(this.CLICKS_BUFFER_KEY, JSON.stringify(clickData));
    } catch (error) {
      console.error('Cache bufferClick error:', error);
    }
  }

  async getBufferedClicks(count: number): Promise<ClickData[]> {
    try {
      const clicks: ClickData[] = [];

      for (let i = 0; i < count; i++) {
        const clickJson = await this.redis.rpop(this.CLICKS_BUFFER_KEY);
        if (!clickJson) break;
        clicks.push(JSON.parse(clickJson) as ClickData);
      }

      return clicks;
    } catch (error) {
      console.error('Cache getBufferedClicks error:', error);
      return [];
    }
  }

  async getBufferedClicksCount(): Promise<number> {
    try {
      return await this.redis.llen(this.CLICKS_BUFFER_KEY);
    } catch (error) {
      console.error('Cache getBufferedClicksCount error:', error);
      return 0;
    }
  }

  // Increment click count atomically in Redis (synced to DB periodically)
  async incrementClickCount(shortCode: string): Promise<number> {
    try {
      const key = `${this.CLICKS_COUNT_PREFIX}${shortCode}`;
      return await this.redis.incr(key);
    } catch (error) {
      console.error('Cache incrementClickCount error:', error);
      return 0;
    }
  }

  async getClickCount(shortCode: string): Promise<number> {
    try {
      const key = `${this.CLICKS_COUNT_PREFIX}${shortCode}`;
      const count = await this.redis.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Cache getClickCount error:', error);
      return 0;
    }
  }

  async resetClickCount(shortCode: string): Promise<void> {
    try {
      const key = `${this.CLICKS_COUNT_PREFIX}${shortCode}`;
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache resetClickCount error:', error);
    }
  }

  // POOL STATISTICS CACHING

  async getPoolStats(): Promise<ShortCodePoolStats | null> {
    try {
      const data = await this.redis.get(this.POOL_STATS_KEY);
      return data ? (JSON.parse(data) as ShortCodePoolStats) : null;
    } catch (error) {
      console.error('Cache getPoolStats error:', error);
      return null;
    }
  }

  async setPoolStats(stats: ShortCodePoolStats): Promise<void> {
    try {
      // Cache for 5 minutes
      await this.redis.setex(this.POOL_STATS_KEY, 300, JSON.stringify(stats));
    } catch (error) {
      console.error('Cache setPoolStats error:', error);
    }
  }

  // HEALTH CHECK & CLEANUP

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  async flushAll(): Promise<void> {
    if (env.NODE_ENV === 'test') {
      await this.redis.flushall();
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();