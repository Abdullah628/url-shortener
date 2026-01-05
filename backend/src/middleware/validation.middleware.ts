import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

type RequestLocation = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, location: RequestLocation = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[location];
      const validated = schema.parse(data);
      req[location] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors. map((err) => ({
          field: err. path. join('.'),
          message: err.message,
        }));
        
        throw new ValidationError('Validation failed', formattedErrors);
      }
      throw error;
    }
  };
}