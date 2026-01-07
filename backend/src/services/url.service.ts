import { urlRepository } from '../repositories/url.repository';
import { userRepository } from '../repositories/user.repository';
import { shortCodeService } from './shortCode.service';
import { cacheService } from './cache.service';
import { 
  Url, 
  UrlResponse, 
  UrlListResponse, 
  CreateUrlDto, 
  PaginationParams,
  CachedUrl 
} from '../types';
import { 
  NotFoundError, 
  ForbiddenError, 
  BadRequestError 
} from '../utils/errors';
import { env } from '../config/env';

export class UrlService {
  /**
   * Create a shortened URL
   */
  async createUrl(userId: string, dto: CreateUrlDto): Promise<UrlResponse> {
    // Check user's URL count against limit
    await this.checkUserLimit(userId);

    // Get a short code from the pre-generated pool
    const shortCode = await shortCodeService.getShortCode();

    // Create the URL record
    const url = await urlRepository.create({
      userId,
      shortCode,
      originalUrl:  dto.originalUrl,
    });

    // Update user's URL count
    await userRepository. updateUrlCount(userId, 1);

    // Invalidate cached user URL count
    await cacheService.incrementUserUrlCount(userId);

    // Cache the URL for fast redirects
    const cachedUrl: CachedUrl = {
      originalUrl: url.originalUrl,
      urlId: url.id,
      isActive: url.isActive,
    };
    await cacheService.setUrl(shortCode, cachedUrl);

    return this.toUrlResponse(url);
  }

  /**
   * Get paginated list of user's URLs
   */
  async getUserUrls(userId: string, pagination: PaginationParams): Promise<UrlListResponse> {
    const result = await urlRepository. findByUserIdPaginated(userId, pagination);

    // Get user's URL count for meta
    const urlCount = await this.getUserUrlCount(userId);

    return {
      urls: result.data. map((url) => this.toUrlResponse(url)),
      pagination: result.pagination,
      meta: {
        urlCount,
        urlLimit: env.MAX_URLS_PER_USER,
        remainingUrls: Math.max(0, env.MAX_URLS_PER_USER - urlCount),
      },
    };
  }

  /**
   * Get a single URL by ID
   */
  async getUrlById(id: string, userId: string): Promise<UrlResponse> {
    const url = await urlRepository. findById(id);

    if (!url) {
      throw new NotFoundError('URL not found');
    }

    if (url.userId !== userId) {
      throw new ForbiddenError('You do not have access to this URL');
    }

    return this.toUrlResponse(url);
  }

  /**
   * Find URL by short code (for redirects)
   */
  async findByShortCode(shortCode: string): Promise<Url | null> {
    // Check cache first
    const cached = await cacheService.getUrl(shortCode);
    
    if (cached) {
      // Return a partial URL object from cache
      return {
        id: cached.urlId,
        userId:  '', // Not needed for redirect
        shortCode,
        originalUrl:  cached.originalUrl,
        clickCount:  0, // Not accurate from cache
        isActive: cached.isActive,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Query database
    const url = await urlRepository. findByShortCode(shortCode);

    if (url && url.isActive) {
      // Cache for future requests
      const cachedUrl: CachedUrl = {
        originalUrl:  url.originalUrl,
        urlId:  url.id,
        isActive: url.isActive,
      };
      await cacheService.setUrl(shortCode, cachedUrl);
    }

    return url;
  }

  /**
   * Delete a URL
   */
  async deleteUrl(id: string, userId: string): Promise<void> {
    // Get the URL first to get the short code
    const url = await urlRepository.findById(id);

    if (!url) {
      throw new NotFoundError('URL not found');
    }

    if (url.userId !== userId) {
      throw new ForbiddenError('You do not have access to this URL');
    }

    // Hard delete the URL
    const result = await urlRepository. hardDelete(id, userId);

    if (! result.deleted) {
      throw new NotFoundError('URL not found');
    }

    // Release the short code back to the pool
    if (result.shortCode) {
      await shortCodeService.releaseShortCode(result. shortCode);
      
      // Clear from cache
      await cacheService.deleteUrl(result.shortCode);
      
      // Clear click count cache
      await cacheService.resetClickCount(result. shortCode);
    }

    // Update user's URL count
    await userRepository. updateUrlCount(userId, -1);
    await cacheService.decrementUserUrlCount(userId);
  }

  /**
   * Check if user has reached their URL limit
   */
  private async checkUserLimit(userId: string): Promise<void> {
    const urlCount = await this.getUserUrlCount(userId);

    if (urlCount >= env.MAX_URLS_PER_USER) {
      throw new BadRequestError(
        `You have reached the maximum limit of ${env.MAX_URLS_PER_USER} URLs.  Please upgrade your plan to create more. `,
        'URL_LIMIT_REACHED'
      );
    }
  }

  /**
   * Get user's URL count (with caching)
   */
  private async getUserUrlCount(userId:  string): Promise<number> {
    // Check cache first
    const cachedCount = await cacheService.getUserUrlCount(userId);
    
    if (cachedCount !== null) {
      return cachedCount;
    }

    // Query database
    const count = await urlRepository.countByUserId(userId);

    // Cache the count
    await cacheService.setUserUrlCount(userId, count);

    return count;
  }

  /**
   * Convert URL entity to response format
   */
  private toUrlResponse(url:  Url): UrlResponse {
    return {
      id:  url.id,
      shortCode: url.shortCode,
      shortUrl: `${env.SHORT_URL_BASE}/${url.shortCode}`,
      originalUrl: url. originalUrl,
      clickCount: url. clickCount,
      isActive: url. isActive,
      createdAt: url. createdAt,
    };
  }
}

// Singleton instance
export const urlService = new UrlService();