import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema),
  (req, res) => authController.register(req, res)
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  (req, res) => authController.login(req, res)
);

// POST /api/auth/logout
router.post(
  '/logout',
  authenticate,
  (req, res) => authController.logout(req, res)
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  (req, res) => authController.me(req, res)
);

export default router;