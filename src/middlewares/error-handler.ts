// Error handler middleware

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    logger.warn(`App Error: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Handle unexpected errors
  logger.error('Unexpected Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = 500;
  const message =
    env.server.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.server.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};
