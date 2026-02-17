import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { ERROR_CODES } from '@webet/shared';

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt-user', { session: false }, (err: any, user: any) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid or expired token',
        },
        meta: {
          timestamp: new Date(),
        },
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt-admin', { session: false }, (err: any, admin: any) => {
    if (err) {
      return next(err);
    }
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid or expired admin token',
        },
        meta: {
          timestamp: new Date(),
        },
      });
    }
    
    req.user = admin;
    next();
  })(req, res, next);
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const admin = req.user as any;
  
  if (!admin || admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: 'Super admin privileges required',
      },
      meta: {
        timestamp: new Date(),
      },
    });
  }
  
  next();
};

// Optional authentication - attaches user if valid token exists, but doesn't require it
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt-user', { session: false }, (err: any, user: any) => {
    if (err) {
      return next(err);
    }
    
    // If user is found, attach to request; otherwise continue without user
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};