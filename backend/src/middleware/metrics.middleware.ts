import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const urlShorteningTotal = new promClient.Counter({
  name: 'url_shortening_total',
  help: 'Total number of URLs shortened',
  registers: [register],
});

export const urlRedirectsTotal = new promClient.Counter({
  name: 'url_redirects_total',
  help: 'Total number of URL redirects',
  registers: [register],
});

export const cacheHitsTotal = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  registers: [register],
});

export const cacheMissesTotal = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  registers: [register],
});

export const shortCodePoolAvailable = new promClient.Gauge({
  name: 'short_code_pool_available',
  help: 'Number of available short codes in pool',
  registers: [register],
});

export const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const clickBufferSize = new promClient.Gauge({
  name: 'click_buffer_size',
  help: 'Number of clicks waiting to be processed',
  registers: [register],
});

export const dbQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  activeConnections.inc();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route?.path || req.path || 'unknown';
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
    activeConnections.dec();
  });

  next();
}

// Metrics endpoint handler
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end('Error collecting metrics');
  }
}

// Export registry for custom metric updates
export { register };