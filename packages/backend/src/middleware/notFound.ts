import { Request, Response } from 'express';
import { ERROR_CODES } from '@webet/shared';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.USER_NOT_FOUND,
      message: `Route ${req.originalUrl} not found`,
    },
    meta: {
      timestamp: new Date(),
    },
  });
};