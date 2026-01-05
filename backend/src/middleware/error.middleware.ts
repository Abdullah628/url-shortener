import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { env } from '../config/env';
import { ApiResponse } from '../types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  // Log error
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV === 'development' ?  err.stack : undefined,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success:  false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    // Add validation details if present
    if (err instanceof ValidationError && err.details) {
      response.error! .details = err. details;
    }

    res.status(err. statusCode).json(response);
    return;
  }

  // Handle Zod validation errors
  if (err. name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err,
      },
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error:  {
        code:  'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    });
    return;
  }

  // Handle unknown errors
  res. status(500).json({
    success:  false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    },
  });
}

// 404 handler
export function notFoundHandler(
  req: Request,
  res: Response<ApiResponse>
): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}