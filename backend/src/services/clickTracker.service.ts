import UAParser from 'ua-parser-js';
import { cacheService } from './cache.service';
import { ClickData } from '../types';

export class ClickTrackerService {
  /**
   * Track a click event asynchronously
   * Buffers clicks in Redis for batch processing
   */
  async trackClick(
    urlId: string,
    request: {
      ip?:  string;
      headers:  {
        'user-agent'?: string;
        'x-forwarded-for'?: string;
        referer?: string;
      };
    }
  ): Promise<void> {
    try {
      const userAgent = request.headers['user-agent'] || '';
      const parser = new UAParser(userAgent);
      const device = parser.getDevice();

      const clickData: ClickData = {
        urlId,
        ipAddress: this.getClientIp(request),
        userAgent: userAgent. substring(0, 512), // Limit length
        referer:  request.headers.referer?. substring(0, 2048) || null,
        deviceType: this.getDeviceType(device. type),
        timestamp: Date.now(),
      };

      // Buffer click for batch processing
      await cacheService.bufferClick(clickData);

      // Also increment the fast counter for real-time stats
      await cacheService.incrementClickCount(urlId);
    } catch (error) {
      // Log but don't fail the redirect
      console.error('Click tracking error:', error);
    }
  }

  /**
   * Get buffered clicks count
   */
  async getBufferedCount(): Promise<number> {
    return await cacheService. getBufferedClicksCount();
  }

  private getClientIp(request: {
    ip?: string;
    headers:  { 'x-forwarded-for'?: string };
  }): string | null {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // Get the first IP in the chain
      return forwardedFor. split(',')[0]?.trim() || null;
    }
    return request.ip || null;
  }

  private getDeviceType(deviceType?: string): string {
    if (! deviceType) return 'desktop';
    
    const type = deviceType.toLowerCase();
    if (type === 'mobile' || type === 'tablet') {
      return type;
    }
    return 'desktop';
  }
}

// Singleton instance
export const clickTrackerService = new ClickTrackerService();