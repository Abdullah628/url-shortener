import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest, JwtPayload } from '../types';
import { UnauthorizedError } from '../utils/errors';

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Get token from Authorization header or cookie
    let token:  string | undefined;

    const authHeader = req. headers. authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?. token) {
      token = req.cookies.token;
    }

    if (! token) {
      throw new UnauthorizedError('Authentication required');
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    throw error;
  }
}

// Optional auth - doesn't throw if no token
export function optionalAuth(
  req:  AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, env. JWT_SECRET) as JwtPayload;
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    }
  } catch {
    // Ignore errors - user remains undefined
  }
  next();
}