import { z } from 'zod';

// User Types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().optional(),
  googleId: z.string(),
  balance: z.number().default(1000),
  totalWinnings: z.number().default(0),
  totalLosses: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// Admin Types
export const AdminSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Admin = z.infer<typeof AdminSchema>;

// Bet Types
export const BetStatusEnum = z.enum(['PENDING', 'WON', 'LOST', 'CANCELLED', 'REFUNDED']);
export const BetTypeEnum = z.enum(['SINGLE', 'PARLAY', 'SYSTEM']);

export const BetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  gameId: z.string(),
  amount: z.number().positive(),
  odds: z.number().positive(),
  potentialWin: z.number().positive(),
  status: BetStatusEnum,
  type: BetTypeEnum,
  selection: z.string(), // e.g., "Team A to win", "Over 2.5 goals"
  createdAt: z.date(),
  updatedAt: z.date(),
  settledAt: z.date().optional(),
});

export type Bet = z.infer<typeof BetSchema>;
export type BetStatus = z.infer<typeof BetStatusEnum>;
export type BetType = z.infer<typeof BetTypeEnum>;

// Game Types
export const GameStatusEnum = z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED']);
export const SportEnum = z.enum(['FOOTBALL', 'BASKETBALL', 'TENNIS', 'SOCCER', 'BASEBALL', 'HOCKEY']);

export const GameSchema = z.object({
  id: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  sport: SportEnum,
  status: GameStatusEnum,
  startTime: z.date(),
  endTime: z.date().optional(),
  homeScore: z.number().optional(),
  awayScore: z.number().optional(),
  odds: z.record(z.string(), z.number()), // flexible odds structure
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Game = z.infer<typeof GameSchema>;
export type GameStatus = z.infer<typeof GameStatusEnum>;
export type Sport = z.infer<typeof SportEnum>;

// Transaction Types
export const TransactionTypeEnum = z.enum(['BET_PLACED', 'BET_WON', 'BET_LOST', 'BET_REFUNDED', 'BONUS', 'ADJUSTMENT']);

export const TransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  betId: z.string().optional(),
  type: TransactionTypeEnum,
  amount: z.number(),
  balanceBefore: z.number(),
  balanceAfter: z.number(),
  description: z.string(),
  createdAt: z.date(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

// AI Suggestion Types
export const AISuggestionSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  suggestion: z.string(),
  confidence: z.number().min(0).max(100),
  odds: z.number().positive(),
  reasoning: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AISuggestion = z.infer<typeof AISuggestionSchema>;

// WebSocket Event Types
export const WSEventTypeEnum = z.enum([
  'BET_PLACED',
  'BET_SETTLED',
  'BET_UPDATE',
  'GAME_UPDATE',
  'ODDS_UPDATE',
  'AI_SUGGESTION',
  'USER_BALANCE_UPDATE',
  'NOTIFICATION'
]);

export const WSEventSchema = z.object({
  type: WSEventTypeEnum,
  userId: z.string().optional(), // for targeted messages
  data: z.record(z.string(), z.any()),
  timestamp: z.date(),
});

export type WSEvent = z.infer<typeof WSEventSchema>;
export type WSEventType = z.infer<typeof WSEventTypeEnum>;

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  meta: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    total: z.number().optional(),
    timestamp: z.date(),
  }).optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: Date;
  };
};

// Validation Schemas for API
export const CreateBetSchema = z.object({
  gameId: z.string(),
  amount: z.number().positive().max(10000), // max bet limit
  selection: z.string(),
  odds: z.number().positive(),
});

export const UpdateGameSchema = z.object({
  homeScore: z.number().optional(),
  awayScore: z.number().optional(),
  status: GameStatusEnum.optional(),
  odds: z.record(z.string(), z.number()).optional(),
});

export const CreateGameSchema = z.object({
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  sport: SportEnum,
  startTime: z.string().datetime(), // ISO string, will be converted to Date
  odds: z.record(z.string(), z.number()),
});

// Export validation schemas
export type CreateBetRequest = z.infer<typeof CreateBetSchema>;
export type UpdateGameRequest = z.infer<typeof UpdateGameSchema>;
export type CreateGameRequest = z.infer<typeof CreateGameSchema>;