import { Response } from 'express';
import { urlService } from '../services/url.service';
import { shortCodeService } from '../services/shortCode.service';
import { AuthRequest, ApiResponse, UrlResponse, UrlListResponse } from '../types';
import { urlShorteningTotal } from '../middleware/metrics.middleware';

export class UrlController {
  /**
   * Create a shortened URL
   * POST /api/urls
   */
  async create(
    req: AuthRequest,
    res:  Response<ApiResponse<UrlResponse>>
  ): Promise<void> {
    const userId = req.user! .userId;
    const { originalUrl } = req.body;

    const url = await urlService. createUrl(userId, { originalUrl });

    // Increment metrics
    urlShorteningTotal.inc();

    res.status(201).json({
      success: true,
      data: url,
    });
  }

  /**
   * Get user's URLs with pagination
   * GET /api/urls
   */
  async list(
    req:  AuthRequest,
    res: Response<ApiResponse<UrlListResponse>>
  ): Promise<void> {
    const userId = req.user! .userId;
    const page = parseInt(req. query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await urlService. getUserUrls(userId, { page, limit });

    res.status(200).json({
      success: true,
      data:  result,
    });
  }

  /**
   * Get a single URL by ID
   * GET /api/urls/: id
   */
  async getById(
    req: AuthRequest,
    res: Response<ApiResponse<UrlResponse>>
  ): Promise<void> {
    const userId = req.user! .userId;
    const { id } = req. params as { id: string };

    const url = await urlService.getUrlById(id, userId);

    res.status(200).json({
      success: true,
      data: url,
    });
  }

  /**
   * Delete a URL
   * DELETE /api/urls/:id
   */
  async delete(
    req: AuthRequest,
    res: Response<ApiResponse<{ message: string }>>
  ): Promise<void> {
    const userId = req.user!. userId;
    const { id } = req.params as { id: string };

    await urlService.deleteUrl(id, userId);

    res.status(200).json({
      success: true,
      data: { message: 'URL deleted successfully' },
    });
  }

  /**
   * Get short code pool statistics
   * GET /api/urls/stats/pool
   */
  async getPoolStats(
    _req: AuthRequest,
    res: Response<ApiResponse<{ pool: { total: number; used:  number; available: number } }>>
  ): Promise<void> {
    const stats = await shortCodeService.getPoolStats();

    res.status(200).json({
      success: true,
      data:  { pool: stats },
    });
  }
}

// Singleton instance
export const urlController = new UrlController();