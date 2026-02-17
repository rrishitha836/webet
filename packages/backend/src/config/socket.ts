import { Server, Socket as SocketIOSocket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { queryOne } from '../lib/db';
import { logger } from './logger';
import { WSEvent, WSEventType } from '@webet/shared';

interface AuthenticatedSocket extends SocketIOSocket {
  userId?: string;
  userType?: 'user' | 'admin';
}

export function setupSocket(io: Server) {
  // Store IO instance for static access
  SocketService.setIO(io);
  
  // Authentication middleware for WebSocket
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Verify user exists and is not suspended
      if (decoded.type === 'user') {
        const user = await queryOne(
          'SELECT id, is_suspended FROM users WHERE id = $1',
          [decoded.sub]
        );
        
        if (!user || user.is_suspended) {
          return next(new Error('Authentication error: Invalid user'));
        }
        
        socket.userId = user.id;
        socket.userType = 'user';
      } else if (decoded.type === 'admin') {
        // Admin users are stored in User table with role ADMIN
        const admin = await queryOne(
          'SELECT id, role FROM users WHERE id = $1',
          [decoded.sub]
        );
        
        if (!admin || admin.role !== 'ADMIN') {
          return next(new Error('Authentication error: Invalid admin'));
        }
        
        socket.userId = admin.id;
        socket.userType = 'admin';
      } else {
        return next(new Error('Authentication error: Invalid token type'));
      }
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (${socket.userType}: ${socket.userId})`);
    
    // Join user to their personal room for targeted messages
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
    
    // Join admin users to admin room
    if (socket.userType === 'admin') {
      socket.join('admin');
    }
    
    // Handle bet subscription
    socket.on('subscribe:bet', (betId: string) => {
      socket.join(`bet:${betId}`);
      logger.info(`Socket ${socket.id} subscribed to bet: ${betId}`);
    });
    
    // Handle bet unsubscription
    socket.on('unsubscribe:bet', (betId: string) => {
      socket.leave(`bet:${betId}`);
      logger.info(`Socket ${socket.id} unsubscribed from bet: ${betId}`);
    });
    
    // Handle active bets subscription
    socket.on('subscribe:active-bets', () => {
      socket.join('active-bets');
      logger.info(`Socket ${socket.id} subscribed to active bets`);
    });
    
    socket.on('unsubscribe:active-bets', () => {
      socket.leave('active-bets');
      logger.info(`Socket ${socket.id} unsubscribed from active bets`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
  
  return io;
}

// Helper functions to emit events
export class SocketService {
  private static io: Server;
  
  static setIO(io: Server) {
    this.io = io;
  }
  
  // Emit to specific user
  static emitToUser(userId: string, event: WSEvent) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event.type, event);
  }
  
  // Emit to all admins
  static emitToAdmins(event: WSEvent) {
    if (!this.io) return;
    this.io.to('admin').emit(event.type, event);
  }
  
  // Emit to all subscribers of a bet
  static emitToBet(betId: string, event: WSEvent) {
    if (!this.io) return;
    this.io.to(`bet:${betId}`).emit(event.type, event);
  }
  
  // Emit to all active bets subscribers
  static emitToActiveBets(event: WSEvent) {
    if (!this.io) return;
    this.io.to('active-bets').emit(event.type, event);
  }
  
  // Emit bet placed notification
  static emitBetPlaced(userId: string, bet: any) {
    const event: WSEvent = {
      type: 'BET_PLACED',
      userId,
      data: { bet },
      timestamp: new Date(),
    };
    
    this.emitToUser(userId, event);
    this.emitToAdmins(event);
  }
  
  // Emit bet settled notification
  static emitBetSettled(userId: string, bet: any) {
    const event: WSEvent = {
      type: 'BET_SETTLED',
      userId,
      data: { bet },
      timestamp: new Date(),
    };
    
    this.emitToUser(userId, event);
  }
  
  // Emit bet update
  static emitBetUpdate(betId: string, bet: any) {
    const event: WSEvent = {
      type: 'BET_UPDATE',
      data: { bet },
      timestamp: new Date(),
    };
    
    this.emitToBet(betId, event);
    this.emitToActiveBets(event);
  }
  
  // Emit AI suggestion
  static emitAISuggestion(suggestion: any) {
    const event: WSEvent = {
      type: 'AI_SUGGESTION',
      data: { suggestion },
      timestamp: new Date(),
    };
    
    // Emit to all connected users
    if (this.io) {
      this.io.emit(event.type, event);
    }
  }
  
  // Emit user balance update
  static emitBalanceUpdate(userId: string, balance: number) {
    const event: WSEvent = {
      type: 'USER_BALANCE_UPDATE',
      userId,
      data: { balance },
      timestamp: new Date(),
    };
    
    this.emitToUser(userId, event);
  }
}
