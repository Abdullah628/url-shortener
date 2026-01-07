import { Router } from 'express';
import authRoutes from './auth.routes';
import urlRoutes from './url.routes';
import { shortCodeService } from '../services/shortCode.service';
import { clickProcessor } from '../jobs/clickProcessor';
import { cacheService } from '../services/cache.service';

const router = Router();

// Health check with detailed status
router.get('/health', async (_req, res) => {
  try {
    const [poolStats, redisHealthy, clickBufferSize] = await Promise. all([
      shortCodeService.getPoolStats(),
      cacheService.ping(),
      cacheService.getBufferedClicksCount(),
    ]);

    const clickProcessorStatus = clickProcessor.getStatus();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          redis: redisHealthy ?  'connected' :  'disconnected',
          clickProcessor: clickProcessorStatus.isRunning ? 'running' : 'stopped',
        },
        stats:  {
          shortCodePool: poolStats,
          pendingClicks: clickBufferSize,
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Auth routes
router. use('/auth', authRoutes);

// URL routes
router. use('/urls', urlRoutes);

export default router;