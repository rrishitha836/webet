// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const calculatePotentialWin = (amount: number, odds: number): number => {
  return amount * odds;
};

export const formatOdds = (odds: number): string => {
  if (odds >= 2) {
    return `+${Math.round((odds - 1) * 100)}`;
  } else {
    return `-${Math.round(100 / (odds - 1))}`;
  }
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Error codes
export const ERROR_CODES = {
  // Authentication
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Not Found
  NOT_FOUND: 'NOT_FOUND',
  
  // Business Logic
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  BET_LIMIT_EXCEEDED: 'BET_LIMIT_EXCEEDED',
  GAME_NOT_AVAILABLE: 'GAME_NOT_AVAILABLE',
  BET_NOT_FOUND: 'BET_NOT_FOUND',
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  OUTCOME_NOT_FOUND: 'OUTCOME_NOT_FOUND',
  WAGER_NOT_FOUND: 'WAGER_NOT_FOUND',
  INVALID_STATUS: 'INVALID_STATUS',
  ALREADY_WAGERED: 'ALREADY_WAGERED',
  DUPLICATE_WAGER: 'DUPLICATE_WAGER',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  BET_CLOSED: 'BET_CLOSED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];