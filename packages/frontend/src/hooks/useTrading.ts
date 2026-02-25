import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Types ──────────────────────────────────────────────────────────
export interface TradeQuote {
  side: 'BUY' | 'SELL';
  outcomeIndex: number;
  shares: number;
  totalCost: number;
  avgPrice: number;
  priceBefore: number;
  priceAfter: number;
  slippage: number;
  newPrices: number[];
  maxProfit: number;
  maxLoss: number;
}

export interface MarketPrices {
  betId: string;
  status: string;
  liquidityB: number;
  totalVolume: number;
  outcomes: {
    id: string;
    label: string;
    index: number;
    price: number;
    sharesQty: number;
  }[];
  prices: number[];
  userPositions: {
    outcomeIndex: number;
    shares: number;
    totalCost: number;
    avgCost: number;
    currentValue: number;
    unrealizedPnl: number;
  }[];
}

export interface TradeResult {
  tradeId: string;
  side: 'BUY' | 'SELL';
  outcomeIndex: number;
  shares: number;
  cost?: number;
  proceeds?: number;
  avgPrice: number;
  priceBefore: number;
  priceAfter: number;
  realizedPnl?: number;
  newPrices: number[];
  newBalance: number;
}

export interface Position {
  betId: string;
  betTitle: string;
  betStatus: string;
  outcomeIndex: number;
  outcomeLabel: string;
  shares: number;
  totalCost: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  pnlPercent: number;
}

export interface PortfolioData {
  positions: Position[];
  summary: {
    totalPositions: number;
    totalInvested: number;
    totalCurrentValue: number;
    totalUnrealizedPnl: number;
    totalPnlPercent: number;
  };
}

export interface TradeHistoryItem {
  id: string;
  betId: string;
  betTitle: string;
  outcomeIndex: number;
  outcomeLabel: string;
  side: 'BUY' | 'SELL';
  shares: number;
  cost: number;
  priceAtTrade: number;
  avgPrice: number;
  createdAt: string;
}

// ─── Hooks ──────────────────────────────────────────────────────────

/**
 * Fetch live market prices + user positions for a bet
 */
export function useMarketPrices(betId: string, enabled = true) {
  return useQuery<MarketPrices>({
    queryKey: ['trading', 'prices', betId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/trading/${betId}/prices`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch prices');
      const data = await res.json();
      return data.data;
    },
    enabled: !!betId && enabled,
    refetchInterval: 10000, // Refresh prices every 10s
    staleTime: 5000,
  });
}

/**
 * Get a trade quote (preview cost/proceeds without executing)
 */
export function useTradeQuote(
  betId: string,
  side: 'BUY' | 'SELL',
  outcomeIndex: number,
  shares: number,
  enabled = true
) {
  return useQuery<TradeQuote>({
    queryKey: ['trading', 'quote', betId, side, outcomeIndex, shares],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/trading/${betId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ side, outcomeIndex, shares }),
      });
      if (!res.ok) throw new Error('Failed to get quote');
      const data = await res.json();
      return data.data;
    },
    enabled: !!betId && shares > 0 && enabled,
    staleTime: 3000,
  });
}

/**
 * Buy shares mutation
 */
export function useBuyShares() {
  const queryClient = useQueryClient();

  return useMutation<TradeResult, Error, { betId: string; outcomeIndex: number; shares: number }>({
    mutationFn: async ({ betId, outcomeIndex, shares }) => {
      const res = await fetch(`${API_URL}/api/trading/${betId}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ outcomeIndex, shares }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to buy shares');
      }
      const data = await res.json();
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trading', 'prices', variables.betId] });
      queryClient.invalidateQueries({ queryKey: ['bets', variables.betId] });
      queryClient.invalidateQueries({ queryKey: ['bets', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['trading', 'portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trading', 'history'] });
    },
  });
}

/**
 * Sell shares mutation
 */
export function useSellShares() {
  const queryClient = useQueryClient();

  return useMutation<TradeResult, Error, { betId: string; outcomeIndex: number; shares: number }>({
    mutationFn: async ({ betId, outcomeIndex, shares }) => {
      const res = await fetch(`${API_URL}/api/trading/${betId}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ outcomeIndex, shares }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to sell shares');
      }
      const data = await res.json();
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trading', 'prices', variables.betId] });
      queryClient.invalidateQueries({ queryKey: ['bets', variables.betId] });
      queryClient.invalidateQueries({ queryKey: ['bets', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['trading', 'portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trading', 'history'] });
    },
  });
}

/**
 * Fetch user's portfolio (all positions)
 */
export function usePortfolio(enabled = true) {
  return useQuery<PortfolioData>({
    queryKey: ['trading', 'portfolio'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/trading/portfolio/me`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      const data = await res.json();
      return data.data;
    },
    enabled,
    staleTime: 15000,
  });
}

/**
 * Fetch user's trade history
 */
export function useTradeHistory(limit = 50) {
  return useQuery<{ data: TradeHistoryItem[]; pagination: { cursor: string | null; hasMore: boolean } }>({
    queryKey: ['trading', 'history', limit],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/trading/history/me?limit=${limit}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch trade history');
      const json = await res.json();
      return { data: json.data, pagination: json.pagination };
    },
    staleTime: 15000,
  });
}

/**
 * Fetch price chart data for a bet
 */
export function usePriceChart(betId: string, enabled = true) {
  return useQuery<{ prices: number[]; volume: number; timestamp: string }[]>({
    queryKey: ['trading', 'chart', betId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/trading/${betId}/chart`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch chart data');
      const data = await res.json();
      return data.data;
    },
    enabled: !!betId && enabled,
    staleTime: 30000,
  });
}
