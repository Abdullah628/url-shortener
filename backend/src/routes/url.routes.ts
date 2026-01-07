import { Router } from 'express';
import { urlController } from '../controllers/url.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';
import { createUrlSchema, paginationSchema, urlIdSchema } from '../utils/validators';

const router = Router();

// All URL routes require authentication
router.use(authenticate);

// POST /api/urls - Create a shortened URL
router.post(
  '/',
  rateLimit('createUrl'),
  validate(createUrlSchema),
  (req, res) => urlController.create(req, res)
);

// GET /api/urls - List user's URLs
router.get(
  '/',
  validate(paginationSchema, 'query'),
  (req, res) => urlController.list(req, res)
);

// GET /api/urls/stats/pool - Get short code pool statistics
router.get(
  '/stats/pool',
  (req, res) => urlController.getPoolStats(req, res)
);

// GET /api/urls/:id - Get a single URL
router. get(
  '/:id',
  validate(urlIdSchema, 'params'),
  (req, res) => urlController.getById(req, res)
);

// DELETE /api/urls/:id - Delete a URL
router. delete(
  '/:id',
  validate(urlIdSchema, 'params'),
  (req, res) => urlController.delete(req, res)
);

export default router;