import { pool } from '../config/database';
import { cacheService } from '../services/cache.service';
import { env } from '../config/env';
import { ClickData } from '../types';

export class ClickProcessor {
  private isRunning = false;
  private intervalId:  NodeJS.Timeout | null = null;
  private isProcessing = false;

  /**
   * Start the click processor background job
   */
  start(): void {
    if (this.isRunning) {
      console.log('Click processor is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔄 Click processor started (interval: ${env. CLICK_PROCESS_INTERVAL_MS}ms)`);

    // Initial processing
    this.processClicks().catch(console.error);

    // Set up interval
    this.intervalId = setInterval(() => {
      this.processClicks().catch(console.error);
    }, env.CLICK_PROCESS_INTERVAL_MS);
  }

  /**
   * Stop the click processor
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Click processor stopped');
  }

  /**
   * Process buffered clicks
   */
  private async processClicks(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get buffered clicks
      const clicks = await cacheService.getBufferedClicks(env.CLICK_BATCH_SIZE);

      if (clicks.length === 0) {
        return;
      }

      console.log(`📊 Processing ${clicks. length} clicks... `);

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Group clicks by URL ID for batch update
        const clicksByUrl = this.groupClicksByUrl(clicks);

        // Insert click events
        for (const click of clicks) {
          await client.query(
            `INSERT INTO click_events (url_id, ip_address, user_agent, referer, device_type, clicked_at)
             VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0))`,
            [
              click. urlId,
              click.ipAddress,
              click.userAgent,
              click.referer,
              click.deviceType,
              click. timestamp,
            ]
          );
        }

        // Batch update click counts
        for (const [urlId, count] of Object.entries(clicksByUrl)) {
          await client.query(
            'UPDATE urls SET click_count = click_count + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [count, urlId]
          );
        }

        await client.query('COMMIT');
        console.log(`✅ Processed ${clicks.length} clicks successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Click processing transaction failed:', error);
        
        // Re-buffer failed clicks
        for (const click of clicks) {
          await cacheService.bufferClick(click);
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Click processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Group clicks by URL ID for batch update
   */
  private groupClicksByUrl(clicks:  ClickData[]): Record<string, number> {
    return clicks.reduce((acc, click) => {
      acc[click.urlId] = (acc[click.urlId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get processor status
   */
  getStatus(): { isRunning: boolean; isProcessing: boolean } {
    return {
      isRunning: this.isRunning,
      isProcessing: this. isProcessing,
    };
  }
}

// Singleton instance
export const clickProcessor = new ClickProcessor();