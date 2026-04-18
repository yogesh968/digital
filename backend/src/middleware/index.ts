// ============================================================
// MIDDLEWARE — Auth, Error Handling, Validation
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError, UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { AuthService } from '../services/AuthService';
import { ITokenPayload, UserRole } from '../entities/types';
import { IApiResponse } from '../entities/types';
import { logger } from '../config/logger';

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: ITokenPayload;
    }
  }
}

// -------------------------------------------------------------------
// AUTH MIDDLEWARE
// -------------------------------------------------------------------
export const createAuthMiddleware = (authService: AuthService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token provided');
      }
      const token = authHeader.slice(7);
      req.user = authService.verifyToken(token);
      next();
    } catch (err) {
      next(err);
    }
  };
};

// -------------------------------------------------------------------
// ROLE GUARD MIDDLEWARE
// -------------------------------------------------------------------
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Role '${req.user.role}' is not authorized for this route`));
      return;
    }
    next();
  };
};

// -------------------------------------------------------------------
// VALIDATION MIDDLEWARE (Zod)
// -------------------------------------------------------------------
export const validate = (schema: ZodSchema, target: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req[target]);
      if (!result.success) {
        const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(422).json({ success: false, error: `Validation failed: ${errors}` } as IApiResponse);
        return;
      }
      req[target] = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// -------------------------------------------------------------------
// GLOBAL ERROR HANDLER MIDDLEWARE
// -------------------------------------------------------------------
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.statusCode}] ${err.code}: ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.code && { code: err.code }),
    } as IApiResponse);
    return;
  }

  // Unexpected error
  logger.error('Unexpected error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  } as IApiResponse);
};

// -------------------------------------------------------------------
// NOT FOUND HANDLER
// -------------------------------------------------------------------
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
};

// -------------------------------------------------------------------
// ZOD SCHEMAS for route validation
// -------------------------------------------------------------------
export const schemas = {
  signup: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password required'),
  }),

  addScore: z.object({
    score: z.number().int().min(1).max(45),
    playedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  }),

  createDraw: z.object({
    drawType: z.enum(['random', 'algorithmic']),
    month: z.string().optional(),
  }),

  createCharity: z.object({
    name: z.string().min(2),
    description: z.string().min(10),
    imageUrl: z.string().url().optional(),
    websiteUrl: z.string().url().optional(),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
  }),

  updateProfile: z.object({
    fullName: z.string().min(2).optional(),
    charityId: z.string().uuid().optional(),
    charityPercentage: z.number().int().min(10).max(100).optional(),
  }),

  reviewVerification: z.object({
    status: z.enum(['approved', 'rejected']),
  }),
};
