import { Request, Response } from 'express';
import { urlService } from '../services/url.service';
import { clickTrackerService } from '../services/clickTracker.service';
import { cacheService } from '../services/cache.service';
import { ApiResponse } from '../types';
import {
  urlRedirectsTotal,
  cacheHitsTotal,
  cacheMissesTotal,
} from '../middleware/metrics.middleware';

export class RedirectController {
  /**
   * Redirect to original URL
   * GET /:shortCode
   */
  async redirect(req: Request, res:  Response): Promise<void> {
    const { shortCode } = req.params as { shortCode: string };

    // Check cache first
    const cached = await cacheService.getUrl(shortCode);

    let originalUrl: string;
    let urlId: string;
    let isActive:  boolean;

    if (cached) {
      // Cache hit
      cacheHitsTotal. inc();
      originalUrl = cached.originalUrl;
      urlId = cached.urlId;
      isActive = cached.isActive;
    } else {
      // Cache miss - query database
      cacheMissesTotal. inc();

      const url = await urlService.findByShortCode(shortCode);

      if (!url) {
        res.status(404).json({
          success: false,
          error: {
            code: 'URL_NOT_FOUND',
            message:  'Short URL not found',
          },
        } as ApiResponse);
        return;
      }

      originalUrl = url.originalUrl;
      urlId = url.id;
      isActive = url.isActive;
    }

    // Check if URL is active
    if (!isActive) {
      res.status(410).json({
        success: false,
        error: {
          code: 'URL_DELETED',
          message:  'This short URL has been deleted',
        },
      } as ApiResponse);
      return;
    }

    // Track click asynchronously (non-blocking)
    clickTrackerService.trackClick(urlId, {
      ip: req.ip,
      headers: {
        'user-agent': req. headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'] as string | undefined,
        referer: req.headers. referer,
      },
    }).catch((error) => {
      console.error('Click tracking failed:', error);
    });

    // Increment redirect counter
    urlRedirectsTotal.inc();

    // 302 redirect (allows tracking each click)
    // Use 301 if you don't need per-click tracking (browsers cache 301)
    res.redirect(302, originalUrl);
  }

  /**
   * Get URL info without redirecting (for preview)
   * GET /api/preview/: shortCode
   */
  async preview(
    req: Request,
    res: Response<ApiResponse<{ originalUrl: string; shortCode: string }>>
  ): Promise<void> {
    const { shortCode } = req.params as { shortCode: string };

    const url = await urlService.findByShortCode(shortCode);

    if (!url || !url.isActive) {
      res.status(404).json({
        success: false,
        error: {
          code: 'URL_NOT_FOUND',
          message: 'Short URL not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data:  {
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
      },
    });
  }
}

// Singleton instance
export const redirectController = new RedirectController();