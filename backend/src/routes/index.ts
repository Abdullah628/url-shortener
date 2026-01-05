import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res. json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

// Auth routes
router.use('/auth', authRoutes);

// URL routes will be added on Day 2
// router.use('/urls', urlRoutes);

export default router;