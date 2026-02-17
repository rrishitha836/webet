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
import { testConnection } from './lib/db';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import gameRoutes from './routes/games';
import betRoutes from './routes/bets';
import webhookRoutes from './routes/webhooks';
import agentRoutes from './routes/agent';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { setupPassport } from './config/passport';
import { setupSocket } from './config/socket';

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
    
    // Error handling middleware
    app.use(notFound);
    app.use(errorHandler);
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
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