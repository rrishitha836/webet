import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import passport from 'passport';

// Import configurations
import { logger } from './config/logger';
import { rateLimiter } from './config/rateLimiter';
import { corsOptions } from './config/cors';
import { testConnection, query } from './lib/db';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import gameRoutes from './routes/games';
import betRoutes from './routes/bets';
import webhookRoutes from './routes/webhooks';
import agentRoutes from './routes/agent';
import tradingRoutes from './routes/trading';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { setupPassport } from './config/passport';
import { setupSocket, SocketService } from './config/socket';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

// Store io instance globally for use in other modules
app.set('io', io);

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to database
    await testConnection();
    logger.info('Database connected successfully');

    // Security middleware
    app.use(helmet());
    app.use(compression());
    app.use(cors(corsOptions));
    
    // Request parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    
    // Logging
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
    
    // Rate limiting
    app.use(rateLimiter);
    
    // Passport configuration
    setupPassport();
    app.use(passport.initialize());
    
    // WebSocket setup
    setupSocket(io);
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
    
    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/games', gameRoutes);
    app.use('/api/bets', betRoutes);
    app.use('/api/webhooks', webhookRoutes);
    app.use('/api/agent', agentRoutes);
    app.use('/api/trading', tradingRoutes);
    
    // Error handling middleware
    app.use(notFound);
    app.use(errorHandler);
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Auto-close expired markets every 60 seconds
    const autoCloseInterval = setInterval(async () => {
      try {
        const result = await query(
          `UPDATE bets SET status = 'CLOSED', updated_at = NOW()
           WHERE status = 'OPEN' AND close_time < NOW()
           RETURNING id, title`
        );
        if (result.rows.length > 0) {
          logger.info(`Auto-closed ${result.rows.length} expired market(s): ${result.rows.map((r: any) => r.title).join(', ')}`);
          for (const row of result.rows) {
            SocketService.emitBetUpdate(row.id, { status: 'CLOSED' });
          }
        }
      } catch (err) {
        logger.error('Auto-close cron error:', err);
      }
    }, 60_000);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      clearInterval(autoCloseInterval);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();