import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ERROR_CODES } from '@webet/shared';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Default error
  let status = err.status || 500;
  let code = err.code || ERROR_CODES.INTERNAL_ERROR;
  let message = err.message || 'Internal Server Error';

  // Database errors
  if (err.message.includes('Unique constraint')) {
    status = 409;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Resource already exists';
  } else if (err.message.includes('Foreign key constraint')) {
    status = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Invalid reference';
  } else if (err.message.includes('Record to update not found')) {
    status = 404;
    code = ERROR_CODES.USER_NOT_FOUND;
    message = 'Resource not found';
  }

  // JWT errors
  if (err.message === 'jwt expired') {
    status = 401;
    code = ERROR_CODES.TOKEN_EXPIRED;
    message = 'Token has expired';
  } else if (err.message === 'invalid token' || err.message === 'jwt malformed') {
    status = 401;
    code = ERROR_CODES.INVALID_TOKEN;
    message = 'Invalid token';
  }

  // Validation errors
  if (err.message.includes('validation')) {
    status = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
  }

  // Don't leak error details in production
  const response = {
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { details: err.details }),
    },
    meta: {
      timestamp: new Date(),
    },
  };

  res.status(status).json(response);
};