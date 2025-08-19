import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-errors';

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
    timestamp: string;
    path: string;
    requestId?: string;
  };
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  const timestamp = new Date().toISOString();
  const path = req.originalUrl;
  const requestId = req.headers['x-request-id'] as string;

  // Handle known application errors
  if (error instanceof AppError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.context,
        timestamp,
        path,
        requestId,
      },
    };

    // Log operational errors at appropriate level
    if (error.isOperational) {
      console.warn('Operational error:', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        path,
        context: error.context,
      });
    } else {
      console.error('Non-operational error:', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        path,
        stack: error.stack,
        context: error.context,
      });
    }

    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle validation errors from libraries (e.g., Zod)
  if (error.name === 'ZodError') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        statusCode: 400,
        details: (error as unknown as { errors: Record<string, unknown> }).errors,
        timestamp,
        path,
        requestId,
      },
    };

    console.warn('Validation error:', {
      path,
      details: (error as unknown as { errors: Record<string, unknown> }).errors,
    });

    res.status(400).json(errorResponse);
    return;
  }

  // Handle unexpected errors
  console.error('Unexpected error:', {
    message: error.message,
    stack: error.stack,
    path,
    timestamp,
  });

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred',
      statusCode: 500,
      timestamp,
      path,
      requestId,
    },
  };

  res.status(500).json(errorResponse);
}

/**
 * 404 handler for routes that don't exist
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND_ERROR',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      requestId: req.headers['x-request-id'] as string,
    },
  };

  res.status(404).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends Request = Request, U extends Response = Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}