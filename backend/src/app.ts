import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { testDatabaseConnection, closeDatabaseConnection } from './config/database';
import { testRedisConnection, closeRedisConnection } from './config/redis';
import { cacheService } from './services/cache.service';
import { clickProcessor } from './jobs/clickProcessor';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { metricsMiddleware, metricsHandler } from './middleware/metrics.middleware';
import { redirectController } from './controllers/redirect.controller';
import { rateLimit } from './middleware/rateLimit.middleware';
import { validate } from './middleware/validation.middleware';
import { shortCodeSchema } from './utils/validators';

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// Metrics middleware (before other middleware for accurate timing)
app.use(metricsMiddleware);

// CORS
app.use(cors({
  origin: env. CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:  ['Content-Type', 'Authorization'],
}));

// Request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app. use(express.json({ limit: '10kb' }));
app.use(express. urlencoded({ extended: true, limit:  '10kb' }));

// Cookie parsing
app.use(cookieParser());

// ============================================
// ROUTES
// ============================================

// Metrics endpoint (for Prometheus)
app.get('/metrics', metricsHandler);

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res. json({
    success: true,
    data: {
      name: 'URL Shortener API',
      version:  '1.0.0',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        urls: '/api/urls',
        redirect: '/:shortCode',
        metrics: '/metrics',
      },
    },
  });
});

// URL Preview endpoint
app.get(
  '/api/preview/: shortCode',
  validate(shortCodeSchema, 'params'),
  (req, res) => redirectController.preview(req, res)
);

// Redirect endpoint (must be after API routes)
app.get(
  '/:shortCode',
  rateLimit('redirect'),
  validate(shortCodeSchema, 'params'),
  (req, res) => redirectController.redirect(req, res)
);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app. use(notFoundHandler);

// Global error handler
app. use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

async function startServer(): Promise<void> {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database.  Exiting.. .');
      process.exit(1);
    }

    // Test Redis connection
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      console.warn('⚠️ Redis connection failed. Caching will be disabled.');
    } else {
      // Start click processor background job
      clickProcessor.start();
    }

    // Start server
    app.listen(env. PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 URL Shortener API Server                                 ║
║                                                               ║
║   Environment: ${env.NODE_ENV. padEnd(44)}║
║   Port:  ${env.PORT. toString().padEnd(51)}║
║   URL:  http://localhost:${env.PORT. toString().padEnd(39)}║
║   Metrics: http://localhost:${env.PORT.toString()}/metrics${' '.repeat(26)}║
║                                                               ║
║   Endpoints:                                                  ║
║   ├── POST   /api/auth/register                               ║
║   ├── POST   /api/auth/login                                  ║
║   ├── POST   /api/auth/logout                                 ║
║   ├── GET    /api/auth/me                                     ║
║   ├── POST   /api/urls                                        ║
║   ├── GET    /api/urls                                        ║
║   ├── GET    /api/urls/: id                                    ║
║   ├── DELETE /api/urls/: id                                    ║
║   ├── GET    /api/preview/: shortCode                          ║
║   └── GET    /:shortCode (redirect)                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('\nShutting down gracefully...');
  
  // Stop background jobs
  clickProcessor.stop();
  
  // Close connections
  await cacheService.disconnect();
  await closeRedisConnection();
  await closeDatabaseConnection();
  
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();

export default app;