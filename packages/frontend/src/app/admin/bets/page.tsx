'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ViewToggle from '@/components/ui/ViewToggle';

interface Bet {
  id: string;
  title: string;
  description: string;
  slug: string;
  shortId: string;
  category: string;
  status: string;
  source: string;
  closeTime: string;
  totalPool: number;
  totalVolume: number;
  participantCount: number;
  createdAt: string;
  outcomes: { id: string; label: string; totalWagers: number; totalCoins: number; tradeVolume: number; currentPrice: number }[];
  createdBy: { displayName: string; email: string };
  winningOutcomeId: string | null;
  _count: { wagers: number; comments: number; reports: number };
}

export default function AdminBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, cursor: null as string | null, hasMore: false });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  // Resolve modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveBet, setResolveBet] = useState<Bet | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [resolving, setResolving] = useState(false);
  const [showEarlyWarning, setShowEarlyWarning] = useState(false);

  const { admin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filters from URL
  const categoryFilter = searchParams.get('category') || 'ALL';
  const statusFilter = searchParams.get('status') || 'ALL';
  const sourceFilter = searchParams.get('source') || 'ALL';

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchBets = useCallback(async (cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const params = new URLSearchParams();
      
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (sourceFilter !== 'ALL') params.append('source', sourceFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (cursor) params.append('cursor', cursor);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bets?${params.toString()}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch bets');

      const data = await response.json();
      
      if (cursor) {
        setBets(prev => [...prev, ...data.data]);
      } else {
        setBets(data.data);
      }
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bets');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryFilter, statusFilter, sourceFilter, debouncedSearch]);

  useEffect(() => {
    if (admin) {
      fetchBets();
    }
  }, [admin, fetchBets]);

  const handleFilterChange = (filterType: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'ALL') {
      params.delete(filterType);
    } else {
      params.set(filterType, value);
    }
    router.push(`/admin/bets?${params.toString()}`);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN': return { bg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-700', dot: 'bg-emerald-500' };
      case 'CLOSED': return { bg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-700', dot: 'bg-amber-500' };
      case 'RESOLVED': return { bg: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-700', dot: 'bg-blue-500' };
      case 'CANCELLED': return { bg: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-700', dot: 'bg-red-500' };
      default: return { bg: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-600', dot: 'bg-gray-500' };
    }
  };

  const getSourceStyle = (source: string) => {
    return source === 'AI_GENERATED'
      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-700'
      : 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-700';
  };

  const getCategoryStyle = () => 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-700';

  const getOutcomeStyle = (index: number) => {
    const styles = [
      'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
      'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700',
      'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
      'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    ];
    return styles[index % styles.length];
  };

  // Helper: is a bet expired (closed and past close time)?
  const isExpired = (bet: Bet) => bet.status === 'CLOSED' && new Date(bet.closeTime) < new Date();

  // Helper: can this bet be resolved?
  const canResolve = (bet: Bet) => (bet.status === 'OPEN' || bet.status === 'CLOSED') && !bet.winningOutcomeId;

  // Helper: is this an early resolution (before close time)?
  const isEarlyResolve = (bet: Bet) => new Date(bet.closeTime) > new Date();

  // Open resolve modal for a specific bet
  const openResolveModal = (e: React.MouseEvent, bet: Bet) => {
    e.preventDefault();
    e.stopPropagation();
    setResolveBet(bet);
    setSelectedOutcome('');
    if (isEarlyResolve(bet)) {
      setShowEarlyWarning(true);
    } else {
      setShowResolveModal(true);
    }
  };

  // Confirm early resolution and proceed to resolve modal
  const confirmEarlyResolve = () => {
    setShowEarlyWarning(false);
    setShowResolveModal(true);
  };

  // Handle resolve confirmation
  const handleResolve = async () => {
    if (!resolveBet || !selectedOutcome) {
      toast.error('Please select a winning outcome');
      return;
    }
    setResolving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bets/${resolveBet.id}/resolve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ winningOutcomeId: selectedOutcome }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to resolve bet');
      }
      toast.success('Bet resolved successfully!');
      setShowResolveModal(false);
      setResolveBet(null);
      fetchBets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve bet');
    } finally {
      setResolving(false);
    }
  };

  // Find winning outcome label for resolved bets
  const getWinningOutcomeLabel = (bet: Bet) => {
    if (!bet.winningOutcomeId) return null;
    return bet.outcomes.find(o => o.id === bet.winningOutcomeId)?.label || null;
  };

  const getPageTitle = () => {
    if (sourceFilter === 'AI_GENERATED') return 'AI Generated Bets';
    if (sourceFilter === 'MANUAL') return 'Manually Created Bets';
    if (categoryFilter !== 'ALL') return `${categoryFilter} Bets`;
    if (statusFilter !== 'ALL') return `${statusFilter} Bets`;
    return 'All Bets';
  };

  return (
    <AdminLayout>
      <AdminPageHeader 
        title={getPageTitle()} 
        subtitle={`${pagination.total} bets found`}
        actions={
          <>
            <ViewToggle view={viewMode} onChange={setViewMode} />
            <Link
              href="/admin/bets/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create New Bet
            </Link>
          </>
        }
      />
      
      <div className="p-8">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors duration-300">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Search</label>
            <input
              type="text"
              placeholder="Search by title, description, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="ALL">All Categories</option>
              <option value="SPORTS">Sports</option>
              <option value="POLITICS">Politics</option>
              <option value="ENTERTAINMENT">Entertainment</option>
              <option value="TECHNOLOGY">Technology</option>
              <option value="CULTURE">Culture</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="ALL">All Sources</option>
              <option value="AI_GENERATED">AI Generated</option>
              <option value="MANUAL">Manually Created</option>
            </select>
          </div>

          {(categoryFilter !== 'ALL' || statusFilter !== 'ALL' || sourceFilter !== 'ALL') && (
            <button
              onClick={() => router.push('/admin/bets')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading bets…</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Bets */}
      {!loading && !error && (
        <div>
          {bets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center py-16 text-center transition-colors duration-300">
              <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No bets found</h3>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-5">Try adjusting your filters or create a new bet.</p>
              <Link
                href="/admin/bets/create"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Create New Bet
              </Link>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-5'}>
            {bets.map((bet, _idx) => {
              const statusStyle = getStatusStyle(bet.status);
              const expired = isExpired(bet);
              const resolvable = canResolve(bet);
              const winnerLabel = getWinningOutcomeLabel(bet);
              return viewMode === 'list' ? (
              /* ─── LIST VIEW CARD ─── */
              <Link key={bet.id} href={`/admin/bets/${bet.id}`} className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-7 group">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {bet.status}
                  </span>
                  {expired && bet.status !== 'RESOLVED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-700 animate-pulse">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                      Expired – Awaiting Resolution
                    </span>
                  )}
                  {bet.status === 'RESOLVED' && winnerLabel && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-700">
                      🏆 Winner: {winnerLabel}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getSourceStyle(bet.source)}`}>
                    {bet.source === 'AI_GENERATED' ? '🤖 AI Generated' : '✏️ Manual'}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getCategoryStyle()}`}>
                    {bet.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white leading-snug mb-5 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{bet.title}</h3>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-0">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 p-3.5 flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">${(bet.totalVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Volume</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 p-3.5 flex items-center gap-3">
                    <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{bet.participantCount}</p>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Traders</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 p-3.5 flex items-center gap-3">
                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{new Date(bet.closeTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Closes</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 p-3.5 flex items-center gap-3">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{new Date(bet.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Created</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-700/50 my-5" />

                {/* Outcomes + Resolve */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const maxVol = Math.max(...bet.outcomes.map(o => (o.tradeVolume || 0) + (o.totalCoins || 0)));
                      return bet.outcomes.map((outcome, oi) => {
                        const vol = (outcome.tradeVolume || 0) + (outcome.totalCoins || 0);
                        const isHighest = vol > 0 && vol === maxVol;
                        return (
                          <span
                            key={outcome.id}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border ${
                              isHighest
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                                : getOutcomeStyle(oi)
                            }`}
                          >
                            {outcome.label}
                            <span className="opacity-40">·</span>
                            <span className="font-bold">${vol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </span>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {resolvable && (
                      <button
                        onClick={(e) => openResolveModal(e, bet)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Resolve
                      </button>
                    )}
                    {bet.status === 'RESOLVED' && winnerLabel && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        🏆 {winnerLabel}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              ) : (
              /* ─── GRID VIEW CARD ─── */
              <Link key={bet.id} href={`/admin/bets/${bet.id}`} className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-6 sm:p-7 flex flex-col group">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyle.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {bet.status}
                  </span>
                  {expired && bet.status !== 'RESOLVED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-700 animate-pulse">
                      ⚠️ Awaiting Resolution
                    </span>
                  )}
                  {bet.status === 'RESOLVED' && winnerLabel && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-700">
                      🏆 {winnerLabel}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getSourceStyle(bet.source)}`}>
                    {bet.source === 'AI_GENERATED' ? '🤖 AI' : '✏️ Manual'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getCategoryStyle()}`}>
                    {bet.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-4 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{bet.title}</h3>

                {/* 2x2 Stat Boxes */}
                <div className="grid grid-cols-2 gap-3 mb-0">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 p-3.5 flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">${(bet.totalVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Volume</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 p-3.5 flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{bet.participantCount}</p>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Traders</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 p-3.5 flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{new Date(bet.closeTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Closes</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 p-3.5 flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{new Date(bet.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Created</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-700/50 my-4" />

                {/* Outcomes */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {(() => {
                    const maxVol = Math.max(...bet.outcomes.map(o => (o.tradeVolume || 0) + (o.totalCoins || 0)));
                    return bet.outcomes.map((outcome, oi) => {
                      const vol = (outcome.tradeVolume || 0) + (outcome.totalCoins || 0);
                      const isHighest = vol > 0 && vol === maxVol;
                      return (
                        <span key={outcome.id} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${
                          isHighest
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                            : getOutcomeStyle(oi)
                        }`}>
                          {outcome.label} <span className="opacity-40">·</span> <span className="font-bold">${vol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </span>
                      );
                    });
                  })()}
                </div>

                {/* Footer — minimal: resolve or winner badge only */}
                <div className="flex items-center justify-end mt-3">
                  {resolvable && (
                    <button
                      onClick={(e) => openResolveModal(e, bet)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Resolve
                    </button>
                  )}
                  {bet.status === 'RESOLVED' && winnerLabel && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      🏆 {winnerLabel}
                    </span>
                  )}
                </div>
              </Link>
              );
            })}
            </div>
          )}

          {/* Load More */}
          {pagination.hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={() => pagination.cursor && fetchBets(pagination.cursor)}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : `Load More (showing ${bets.length} of ${pagination.total})`}
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* ── Early Resolution Warning Modal ── */}
      {showEarlyWarning && resolveBet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowEarlyWarning(false); setResolveBet(null); }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Early Resolution Warning</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">This market has not closed yet</p>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>&ldquo;{resolveBet.title}&rdquo;</strong> is scheduled to close on{' '}
                <strong>{new Date(resolveBet.closeTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong>.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                Resolving early will immediately close the market, settle all positions, and prevent further trading. This action <strong>cannot be undone</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowEarlyWarning(false); setResolveBet(null); }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEarlyResolve}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-red-600 text-white font-medium text-sm hover:from-amber-700 hover:to-red-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Proceed to Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resolve Modal ── */}
      {showResolveModal && resolveBet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !resolving && setShowResolveModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Resolve Bet</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">{resolveBet.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Select the winning outcome. This action cannot be undone.</p>
            <div className="space-y-2 mb-6">
              {resolveBet.outcomes.map((outcome) => (
                <label
                  key={outcome.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedOutcome === outcome.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-700'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="winningOutcome"
                    value={outcome.id}
                    checked={selectedOutcome === outcome.id}
                    onChange={(e) => setSelectedOutcome(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">{outcome.label}</span>
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">${((outcome.tradeVolume || 0) + (outcome.totalCoins || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} volume</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowResolveModal(false); setResolveBet(null); }}
                disabled={resolving}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving || !selectedOutcome}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resolving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Resolving…
                  </>
                ) : 'Confirm Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
