import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fetch AI suggestions
export function useAISuggestions(status?: string) {
  return useQuery({
    queryKey: ['admin', 'ai-suggestions', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const res = await fetch(`${API_URL}/api/admin/ai-suggestions?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch AI suggestions');
      const data = await res.json();
      return data.data;
    },
  });
}

// Approve AI suggestion
export function useApproveAISuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const res = await fetch(`${API_URL}/api/admin/ai-suggestions/${suggestionId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to approve suggestion');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['bets'] });
    },
  });
}

// Reject AI suggestion
export function useRejectAISuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const res = await fetch(`${API_URL}/api/admin/ai-suggestions/${suggestionId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to reject suggestion');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-suggestions'] });
    },
  });
}

// Create manual bet
export function useCreateBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (betData: {
      question: string;
      description?: string;
      category: string;
      endTime: Date;
      outcomes: string[];
    }) => {
      const res = await fetch(`${API_URL}/api/admin/bets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(betData),
      });
      if (!res.ok) throw new Error('Failed to create bet');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bets'] });
    },
  });
}

// Fetch all bets for admin
export function useAdminBets(filters?: { status?: string; category?: string; source?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'bets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.source) params.append('source', filters.source);
      if (filters?.page) params.append('page', filters.page.toString());
      
      const res = await fetch(`${API_URL}/api/admin/bets?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch bets');
      const data = await res.json();
      return data.data;
    },
  });
}

// Resolve bet
export function useResolveBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      betId,
      winningOutcomeId,
    }: {
      betId: string;
      winningOutcomeId: string;
    }) => {
      const res = await fetch(`${API_URL}/api/admin/bets/${betId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ winningOutcomeId }),
      });
      if (!res.ok) throw new Error('Failed to resolve bet');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bets', variables.betId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bets'] });
    },
  });
}

// Cancel bet
export function useCancelBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (betId: string) => {
      const res = await fetch(`${API_URL}/api/admin/bets/${betId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to cancel bet');
      return res.json();
    },
    onSuccess: (_, betId) => {
      queryClient.invalidateQueries({ queryKey: ['bets', betId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bets'] });
    },
  });
}

// Fetch analytics
export function useAnalytics(period?: string) {
  return useQuery({
    queryKey: ['admin', 'analytics', period],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      
      const res = await fetch(`${API_URL}/api/admin/analytics?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      return data.data;
    },
  });
}
