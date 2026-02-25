import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { query, queryOne } from '../lib/db';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export function setupPassport() {
  // Google OAuth Strategy for users
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          const googleId = profile.id;
          const avatarUrl = profile.photos?.[0]?.value || null;
          
          if (!email) {
            return done(new Error('No email provided from Google'));
          }
          
          // Find existing user
          let user = await queryOne(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );
          
          if (user) {
            // Update existing user with latest Google info
            user = await queryOne(
              `UPDATE users SET google_id = $1, avatar_url = $2, last_login_at = NOW(), updated_at = NOW() 
               WHERE id = $3 RETURNING *`,
              [googleId, avatarUrl, user.id]
            );
          } else {
            // Create new user with $1000 starting balance
            const userId = uuidv4();
            user = await queryOne(
              `INSERT INTO users (id, email, display_name, google_id, avatar_url, balance, last_login_at, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, 1000, NOW(), NOW(), NOW()) RETURNING *`,
              [userId, email, name, googleId, avatarUrl]
            );
            
            // Create welcome notification
            await query(
              `INSERT INTO notifications (id, user_id, type, title, message)
               VALUES ($1, $2, 'WELCOME', 'Welcome to WeBet!', 'You have been awarded $1,000.00 to start betting!')`,
              [uuidv4(), user.id]
            );
          }
          
          // Convert to camelCase for compatibility
          const userData = {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            googleId: user.google_id,
            avatarUrl: user.avatar_url,
            balance: user.balance,
            role: user.role,
            isSuspended: user.is_suspended,
          };
          
          done(null, userData);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          done(error as Error);
        }
      }
    )
  );

  // JWT Strategy for user authentication
  passport.use(
    'jwt-user',
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromAuthHeaderAsBearerToken(),
          (req) => req.cookies?.jwt, // Extract from cookie
        ]),
        secretOrKey: process.env.JWT_SECRET!,
      },
      async (payload, done) => {
        try {
          if (payload.type !== 'user') {
            return done(null, false);
          }
          
          const user = await queryOne(
            'SELECT * FROM users WHERE id = $1',
            [payload.sub]
          );
          
          if (!user || user.is_suspended) {
            return done(null, false);
          }
          
          // Convert to camelCase for compatibility
          const userData = {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            googleId: user.google_id,
            avatarUrl: user.avatar_url,
            balance: user.balance,
            role: user.role,
            isSuspended: user.is_suspended,
          };
          
          done(null, userData);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  // JWT Strategy for admin authentication (admins are users with ADMIN role)
  passport.use(
    'jwt-admin',
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromAuthHeaderAsBearerToken(),
          (req) => req.cookies?.jwt, // Extract from cookie
        ]),
        secretOrKey: process.env.JWT_SECRET!,
      },
      async (payload, done) => {
        try {
          if (payload.type !== 'admin') {
            return done(null, false);
          }
          
          const admin = await queryOne(
            'SELECT * FROM users WHERE id = $1',
            [payload.sub]
          );
          
          if (!admin || admin.role !== 'ADMIN' || admin.is_suspended) {
            return done(null, false);
          }
          
          // Convert to camelCase for compatibility
          const adminData = {
            id: admin.id,
            email: admin.email,
            displayName: admin.display_name,
            avatarUrl: admin.avatar_url,
            role: admin.role,
            isSuspended: admin.is_suspended,
          };
          
          done(null, adminData);
        } catch (error) {
          done(error);
        }
      }
    )
  );
}
