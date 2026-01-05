import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { testDatabaseConnection, closeDatabaseConnection } from './config/database';
import { testRedisConnection, closeRedisConnection } from './config/redis';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// MIDDLEWARE

// Security headers
app.use(helmet());

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

// ROUTES

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res. json({
    success: true,
    data: {
      name: 'URL Shortener API',
      version:  '1.0.0',
      documentation: '/api/health',
    },
  });
});

// ERROR HANDLING

// 404 handler
app.use(notFoundHandler);

// Global error handler
app. use(errorHandler);

// SERVER STARTUP

async function startServer(): Promise<void> {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database.  Exiting...');
      process.exit(1);
    }

    // Test Redis connection
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      console. warn('⚠️ Redis connection failed. Caching will be disabled.');
    }

    // Start server
    app.listen(env. PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 URL Shortener API Server                             ║
║                                                           ║
║   Environment: ${env.NODE_ENV. padEnd(40)}║
║   Port:  ${env.PORT. toString().padEnd(47)}║
║   URL:  http://localhost:${env.PORT. toString().padEnd(35)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
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
  await closeDatabaseConnection();
  await closeRedisConnection();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();

export default app;