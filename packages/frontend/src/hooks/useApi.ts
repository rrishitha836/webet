import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fetch open bets (PRD: /api/v1/bets)
export function useActiveBets(filters?: { category?: string; status?: string; sort?: string; search?: string }, enabled: boolean = true) {
  return useQuery({
    queryKey: ['bets', 'active', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category && filters.category !== 'ALL') {
        params.append('category', filters.category);
      }
      params.append('status', 'OPEN');
      if (filters?.sort) {
        params.append('sort', filters.sort);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      
      const res = await fetch(`${API_URL}/api/bets?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch bets');
      const data = await res.json();
      
      // Transform to component-friendly format
      return data.data?.map((bet: any) => ({
        id: bet.id,
        question: bet.title,
        description: bet.description,
        category: bet.category,
        endTime: bet.closeTime,
        status: bet.status,
        totalPool: bet.totalPool,
        liquidityB: bet.liquidityB,
        totalVolume: bet.totalVolume,
        outcomeShares: bet.outcomeShares,
        marketType: bet.marketType,
        outcomes: bet.outcomes?.map((o: any) => ({
          id: o.id,
          text: o.label,
          totalStake: o.totalCoins,
          totalWagers: o.totalWagers,
          currentPrice: o.currentPrice,
          sharesQty: o.sharesQty,
        })) || [],
        _count: { participants: bet.participantCount },
        slug: bet.slug,
        shortId: bet.shortId,
      })) || [];
    },
    enabled,
  });
}

// Fetch bet by ID
export function useBet(betId: string) {
  return useQuery({
    queryKey: ['bets', betId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/bets/${betId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch bet');
      const data = await res.json();
      const bet = data.data;
      // Transform to component-friendly format (same as useActiveBets)
      return {
        ...bet,
        question: bet.title,
        endTime: bet.closeTime,
        // LMSR prediction market fields
        liquidityB: bet.liquidityB,
        totalVolume: bet.totalVolume,
        outcomeShares: bet.outcomeShares,
        marketType: bet.marketType,
        outcomes: bet.outcomes?.map((o: any) => ({
          id: o.id,
          text: o.label,
          totalStake: o.totalCoins,
          totalWagers: o.totalWagers,
          sortOrder: o.sortOrder,
          currentPrice: o.currentPrice,
          sharesQty: o.sharesQty,
        })) || [],
        _count: {
          participants: bet.participantCount,
          ...(bet._count || {}),
        },
      };
    },
    enabled: !!betId,
  });
}

// Place a bet
export function usePlaceBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      betId,
      outcomeId,
      amount,
    }: {
      betId: string;
      outcomeId: string;
      amount: number;
    }) => {
      const res = await fetch(`${API_URL}/api/bets/${betId}/wager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ outcomeId, amount }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to place bet');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bets', variables.betId] });
      queryClient.invalidateQueries({ queryKey: ['bets', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'bets'] });
    },
  });
}

// Fetch user's bets
export function useUserBets(status?: string, search?: string) {
  return useQuery({
    queryKey: ['users', 'bets', status, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      
      const res = await fetch(`${API_URL}/api/users/bets?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch user bets');
      const data = await res.json();
      return data.data;
    },
  });
}

// Fetch ALL user bets (no filter) for client-side filtering + counts
export function useAllUserBets() {
  return useQuery({
    queryKey: ['users', 'bets', 'all'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/users/bets?limit=200`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch user bets');
      const data = await res.json();
      return data.data || [];
    },
  });
}

// Fetch user profile
export function useUserProfile() {
  return useQuery({
    queryKey: ['users', 'profile'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      return data.data;
    },
    // Keep profile reasonably fresh for dashboard stats — poll in background
    staleTime: 0,
    refetchInterval: 15000, // refetch every 15s
    refetchOnWindowFocus: true,
  });
}

// Update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { name?: string; avatar?: string }) => {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
}

// Fetch notifications
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/users/notifications`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      return data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`${API_URL}/api/users/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to mark notification as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  avatarUrl: string | null;
  balance: number;
  portfolioValue: number;
  netWorth: number;
  totalBets: number;
  totalWins: number;
  activePositions: number;
  winRate: number;
}

export function useLeaderboard(limit = 50) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/users/leaderboard?limit=${limit}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      return data.data;
    },
    staleTime: 30000,
  });
}
