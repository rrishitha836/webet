import { Router, type Router as RouterType } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../lib/db';
import { ERROR_CODES } from '@webet/shared';
import { authenticateUser, authenticateAdmin } from '../middleware/auth';
import { logger } from '../config/logger';
import bcrypt from 'bcryptjs';

const router: RouterType = Router();

// Helper function to generate JWT tokens
function generateToken(userId: string, type: 'user' | 'admin'): string {
  return jwt.sign(
    { sub: userId, type },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
}

// GET /api/auth/google - Initiate Google OAuth
router.get('/google', (req, res, next) => {
  const redirectUrl = req.query.redirect as string;
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: redirectUrl ? Buffer.from(redirectUrl).toString('base64') : undefined,
  })(req, res, next);
});

// GET /api/auth/google/callback - Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=auth_failed' }),
  async (req, res) => {
    try {
      const user = req.user as any;
      const token = generateToken(user.id, 'user');
      
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      
      let redirect = '/';
      if (req.query.state) {
        try {
          redirect = Buffer.from(req.query.state as string, 'base64').toString();
        } catch (e) {
          redirect = '/';
        }
      }
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?success=true&redirect=${encodeURIComponent(redirect)}`);
    } catch (error) {
      logger.error('Google callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?error=auth_failed`);
    }
  }
);

// POST /api/auth/validate - Validate JWT token
router.post('/validate', async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Token is required',
        },
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      
      const user = await queryOne(
        `SELECT id, email, display_name, avatar_url, balance, role 
         FROM users WHERE id = $1`,
        [decoded.sub]
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.USER_NOT_FOUND,
            message: 'User not found',
          },
        });
      }

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          balance: user.balance,
          role: user.role,
        },
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid token',
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/admin/login - Admin login with email/password
router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Email and password are required',
        },
      });
    }

    const admin = await queryOne(
      `SELECT id, email, display_name, avatar_url, role, is_suspended, password_hash 
       FROM users WHERE email = $1`,
      [email]
    );

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid credentials',
        },
      });
    }

    if (admin.is_suspended) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Account is suspended',
        },
      });
    }

    if (!admin.password_hash) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid credentials',
        },
      });
    }

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid credentials',
        },
      });
    }

    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [admin.id]);

    const token = generateToken(admin.id, 'admin');

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          displayName: admin.display_name,
          role: admin.role,
          lastLoginAt: admin.last_login_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/admin/logout - Admin logout
router.post('/admin/logout', authenticateAdmin, async (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// POST /api/auth/logout - Logout
router.post('/logout', authenticateUser, async (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user as any;
    
    const fullUser = await queryOne(
      `SELECT 
        u.id, u.email, u.display_name, u.avatar_url, u.balance, u.role,
        u.total_bets, u.total_wins, u.created_at,
        (SELECT COUNT(*) FROM wagers WHERE user_id = u.id) as wager_count,
        (SELECT COUNT(*) FROM bets WHERE created_by = u.id) as created_bets_count
       FROM users u WHERE u.id = $1`,
      [user.id]
    );

    if (!fullUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: fullUser.id,
        email: fullUser.email,
        displayName: fullUser.display_name,
        avatarUrl: fullUser.avatar_url,
        balance: fullUser.balance,
        role: fullUser.role,
        totalBets: fullUser.total_bets,
        totalWins: fullUser.total_wins,
        createdAt: fullUser.created_at,
        _count: {
          wagers: parseInt(fullUser.wager_count),
          createdBets: parseInt(fullUser.created_bets_count),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/admin/me - Get current admin info
router.get('/admin/me', authenticateAdmin, async (req, res, next) => {
  try {
    const admin = req.user as any;
    
    const fullAdmin = await queryOne(
      `SELECT id, email, display_name, avatar_url, role, last_login_at, created_at 
       FROM users WHERE id = $1`,
      [admin.id]
    );

    if (!fullAdmin) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'Admin not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: fullAdmin.id,
        email: fullAdmin.email,
        displayName: fullAdmin.display_name,
        avatarUrl: fullAdmin.avatar_url,
        role: fullAdmin.role,
        lastLoginAt: fullAdmin.last_login_at,
        createdAt: fullAdmin.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
