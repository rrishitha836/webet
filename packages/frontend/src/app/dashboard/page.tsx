'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import { useAllUserBets, useUserProfile } from '@/hooks/useApi';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { BetDetailsModal } from '@/components/bets/BetDetailsModal';
import { useRouter } from 'next/navigation';
import ViewToggle from '@/components/ui/ViewToggle';
import UserLayout from '@/components/layout/UserLayout';
import BoltIcon from '@mui/icons-material/Bolt';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import HistoryIcon from '@mui/icons-material/History';

// ── Color helpers ──
function getOutcomeColor(label: string): { bg: string; text: string; border: string; bar: string } {
  const normalized = label?.toUpperCase().trim();
  if (normalized === 'YES') return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700', border: 'border-emerald-300', bar: 'bg-emerald-50 dark:bg-emerald-900/200' };
  if (normalized === 'NO') return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700', border: 'border-red-300', bar: 'bg-red-50 dark:bg-red-900/200' };
  if (normalized === 'DRAW') return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700', border: 'border-amber-300', bar: 'bg-amber-50 dark:bg-amber-900/200' };
  const pastels = [
    { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700', border: 'border-violet-300', bar: 'bg-violet-50 dark:bg-violet-900/200' },
    { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700', border: 'border-sky-300', bar: 'bg-sky-50 dark:bg-sky-900/200' },
    { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700', border: 'border-pink-300', bar: 'bg-pink-50 dark:bg-pink-900/200' },
    { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700', border: 'border-teal-300', bar: 'bg-teal-50 dark:bg-teal-900/200' },
    { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700', border: 'border-orange-300', bar: 'bg-orange-50 dark:bg-orange-900/200' },
    { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700', border: 'border-indigo-300', bar: 'bg-indigo-50 dark:bg-indigo-900/200' },
  ];
  const hash = label?.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 0;
  return pastels[hash % pastels.length];
}

function getWagerStatusBadge(status: string) {
  switch (status) {
    case 'WON': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-700';
    case 'LOST': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-700';
    case 'ACTIVE': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700';
    case 'REFUNDED': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  }
}

function getBetStatusBadge(status: string) {
  switch (status) {
    case 'OPEN': return 'bg-green-50 dark:bg-green-900/20 text-green-700 ring-1 ring-green-200';
    case 'CLOSED': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 ring-1 ring-yellow-200';
    case 'RESOLVED': return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 ring-1 ring-purple-200';
    case 'CANCELLED': return 'bg-red-50 dark:bg-red-900/20 text-red-700 ring-1 ring-red-200';
    case 'PAUSED': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 ring-1 ring-orange-200';
    default: return 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}

// ── Type ──
type MyBetsFilter = 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'HISTORY';

function DashboardContent() {
  const [myBetsFilter, setMyBetsFilter] = useState<MyBetsFilter>('ACTIVE');
  const [selectedBetId, setSelectedBetId] = useState<string | null>(null);
  const [selectedUserWager, setSelectedUserWager] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [myBetsViewMode, setMyBetsViewMode] = useState<'grid' | 'list'>('grid');

  // ── Fetch ALL user bets once ──
  const { data: allBets, isLoading: betsLoading } = useAllUserBets();
  const { data: profile } = useUserProfile();
  const router = useRouter();

  // Derived dashboard stats with fallbacks in case `profile.stats` is not yet populated
  const totalBetsCount = profile?.stats?.totalBets ?? profile?.totalBets ?? (allBets?.length || 0);
  const totalWinningsAmount = profile?.stats?.totalWinnings ?? profile?.totalWinnings ?? 0;
  const winRatePct = profile?.stats?.winRate != null ? profile.stats.winRate : (totalBetsCount > 0 ? 0 : 0);

  // ── Client-side filtering via useMemo ──
  const activeBetsList = useMemo(() => {
    if (!allBets) return [];
    return allBets.filter((b: any) => b.status === 'OPEN' && b.wager?.status === 'ACTIVE');
  }, [allBets]);

  const pendingBetsList = useMemo(() => {
    if (!allBets) return [];
    return allBets.filter((b: any) => b.status === 'CLOSED' && b.wager?.status === 'ACTIVE');
  }, [allBets]);

  const completedBetsList = useMemo(() => {
    if (!allBets) return [];
    const now = Date.now();
    return allBets.filter((b: any) => {
      const ws = b.wager?.status;
      // Primary: user wager indicates final outcome
      if (['WON', 'LOST', 'REFUNDED', 'COMPLETED'].includes(ws)) return true;
      // If bet is explicitly resolved include it (user participated previously)
      // Show RESOLVED bets in Completed even if wager/shares fields are empty
      if (b.status === 'RESOLVED') return true;
      // Treat CLOSED bets whose closeTime has passed and where the user had a stake as completed
      try {
        const closeTs = b.closeTime ? new Date(b.closeTime).getTime() : 0;
        if (b.status === 'CLOSED' && closeTs > 0 && closeTs < now && (b.wager?.shares || b.wager?.amount)) return true;
      } catch (e) {
        // ignore parse errors
      }
      return false;
    });
  }, [allBets]);

  const historyBetsList = useMemo(() => {
    if (!allBets) return [];
    if (!searchQuery) return allBets;
    const q = searchQuery.toLowerCase();
    return allBets.filter((b: any) =>
      b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)
    );
  }, [allBets, searchQuery]);

  const currentBetsList = useMemo(() => {
    switch (myBetsFilter) {
      case 'ACTIVE': return activeBetsList;
      case 'PENDING': return pendingBetsList;
      case 'COMPLETED': return completedBetsList;
      case 'HISTORY': return historyBetsList;
      default: return [];
    }
  }, [myBetsFilter, activeBetsList, pendingBetsList, completedBetsList, historyBetsList]);

  // ── Dynamic tab counts ──
  const tabCounts = useMemo(() => ({
    ACTIVE: activeBetsList.length,
    PENDING: pendingBetsList.length,
    COMPLETED: completedBetsList.length,
    HISTORY: allBets?.length || 0,
  }), [activeBetsList, pendingBetsList, completedBetsList, allBets]);

  const myBetsTabs: { key: MyBetsFilter; label: string; description: string; icon: React.ReactNode }[] = [
    { key: 'ACTIVE', label: 'Active', description: 'Open bets you\'ve joined', icon: <BoltIcon fontSize="small" /> },
    { key: 'PENDING', label: 'Pending Results', description: 'Closed bets awaiting resolution', icon: <HourglassTopIcon fontSize="small" /> },
    { key: 'COMPLETED', label: 'Completed', description: 'Resolved bets with outcomes', icon: <TaskAltIcon fontSize="small" /> },
    { key: 'HISTORY', label: 'History', description: 'Full chronological log', icon: <HistoryIcon fontSize="small" /> },
  ];

  const handleOpenBetDetails = useCallback((bet: any) => {
    setSelectedBetId(bet.id);
    setSelectedUserWager(bet.wager);
  }, []);

  const handleCloseBetDetails = useCallback(() => {
    setSelectedBetId(null);
    setSelectedUserWager(null);
  }, []);

  // ── Time helpers ──
  const formatTimeLeft = (closeTime: string) => {
    const diff = new Date(closeTime).getTime() - Date.now();
    if (diff <= 0) return 'Closed';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <UserLayout>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Stats Overview ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                Active
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">${profile?.balance?.toLocaleString() || '0'}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Current Balance</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              {(profile?.stats?.totalBets ?? profile?.totalBets ?? 0) > 0 && (
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded-full">
                  +{profile?.stats?.totalBets ?? profile?.totalBets ?? 0} placed
                </span>
              )}
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{totalBetsCount}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Total Bets Placed</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              {(profile?.stats?.wins ?? 0) > 0 && (
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                  {profile?.stats?.wins ?? 0}W / {profile?.stats?.losses ?? 0}L
                </span>
              )}
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 mb-0.5">
              {winRatePct != null ? `${winRatePct}%` : '0%'}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Win Rate</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 dark:group-hover:bg-amber-800 transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
              </div>
              {(profile?.stats?.totalWinnings ?? 0) > 0 && (
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  Profit
                </span>
              )}
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-600 mb-0.5">
              ${totalWinningsAmount?.toLocaleString ? totalWinningsAmount.toLocaleString() : totalWinningsAmount}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Total Winnings</p>
          </div>
        </div>

        {/* ── My Bets Section ── */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Bets</h2>
          <div className="flex items-center justify-between gap-4">
            <div className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-2.5 pb-1">
              {myBetsTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setMyBetsFilter(tab.key);
                    if (tab.key !== 'HISTORY') setSearchQuery('');
                  }}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                    myBetsFilter === tab.key
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.key === 'PENDING' ? 'Pending' : tab.key === 'COMPLETED' ? 'Done' : tab.label}</span>
                  <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full transition-colors ${
                    myBetsFilter === tab.key
                      ? 'bg-white/25 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {tabCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>
            <ViewToggle view={myBetsViewMode} onChange={setMyBetsViewMode} />
          </div>
        </div>

        {/* Search (History tab only) */}
        {myBetsFilter === 'HISTORY' && (
          <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by bet title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {/* ── Bet Cards ── */}
        {betsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : currentBetsList.length > 0 ? (
          <div className={myBetsViewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5' : 'space-y-3'}>
            {currentBetsList.map((bet: any) => {
              const outcomeColor = getOutcomeColor(bet.wager?.outcome?.label || '');
              const isWon = bet.wager?.status === 'WON';
              const isLost = bet.wager?.status === 'LOST';
              const isRefunded = bet.wager?.status === 'REFUNDED';

              return myBetsViewMode === 'list' ? (
                <div
                  key={bet.wager?.id || bet.id}
                  onClick={() => handleOpenBetDetails(bet)}
                  className={`group bg-white dark:bg-gray-800 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer p-4 flex items-center gap-4 ${
                    isWon ? 'border-emerald-200 ring-1 ring-emerald-100' :
                    isLost ? 'border-red-200 ring-1 ring-red-100' :
                    'border-gray-200 dark:border-gray-700 hover:border-blue-200'
                  }`}
                >
                  {myBetsFilter === 'COMPLETED' && (
                    <div className={`w-1 h-10 rounded-full shrink-0 ${isWon ? 'bg-emerald-50 dark:bg-emerald-900/200' : isLost ? 'bg-red-50 dark:bg-red-900/200' : 'bg-amber-50 dark:bg-amber-900/200'}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{bet.title}</h3>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${getWagerStatusBadge(bet.wager?.status)}`}>{bet.wager?.status}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${getBetStatusBadge(bet.status)}`}>{bet.status}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex items-center gap-1 ${outcomeColor.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${outcomeColor.bar}`} />
                        {bet.wager?.outcome?.label || 'N/A'}
                      </span>
                      <span>Staked ${bet.wager?.amount?.toLocaleString() || 0}</span>
                      {bet.wager?.shares != null && bet.wager.shares > 0 && (
                        <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                          {bet.wager.shares.toFixed(1)} shares
                        </span>
                      )}
                      <span>{bet.category}</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 shrink-0 text-sm">
                    {myBetsFilter === 'ACTIVE' && bet.status === 'OPEN' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/bets/${bet.id}`); }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800 border border-blue-200 dark:border-blue-700 transition-colors"
                      >
                        Trade
                      </button>
                    )}
                    {myBetsFilter === 'ACTIVE' && (
                      <span className="font-semibold text-orange-600 text-xs">{bet.closeTime ? formatTimeLeft(bet.closeTime) : '\u2014'}</span>
                    )}
                    {myBetsFilter === 'COMPLETED' && (
                      <span className={`font-semibold text-xs ${isWon ? 'text-emerald-600' : isLost ? 'text-red-600' : 'text-amber-600'}`}>
                        {isWon ? '+' : isLost ? '-' : ''}${bet.wager?.amount?.toLocaleString() || 0}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  key={bet.wager?.id || bet.id}
                  onClick={() => handleOpenBetDetails(bet)}
                  className={`group bg-white dark:bg-gray-800 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                    isWon ? 'border-emerald-200 ring-1 ring-emerald-100' :
                    isLost ? 'border-red-200 ring-1 ring-red-100' :
                    'border-gray-200 dark:border-gray-700 hover:border-blue-200'
                  }`}
                >
                  {/* Win/Loss accent bar */}
                  {myBetsFilter === 'COMPLETED' && (
                    <div className={`h-1 ${isWon ? 'bg-emerald-50 dark:bg-emerald-900/200' : isLost ? 'bg-red-50 dark:bg-red-900/200' : 'bg-amber-50 dark:bg-amber-900/200'}`} />
                  )}

                  <div className="p-4 sm:p-5">
                    {/* Title + Badges */}
                    <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {bet.title}
                      </h3>
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold ${getWagerStatusBadge(bet.wager?.status)}`}>
                          {bet.wager?.status}
                        </span>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium ${getBetStatusBadge(bet.status)}`}>
                          {bet.status}
                        </span>
                      </div>
                    </div>

                    {/* Selected Outcome Chip */}
                    <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:py-1.5 rounded-lg border ${outcomeColor.bg} ${outcomeColor.border} mb-3 sm:mb-4`}>
                      <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${outcomeColor.bar}`} />
                      <span className={`text-xs sm:text-sm font-medium ${outcomeColor.text}`}>
                        {bet.wager?.outcome?.label || 'N/A'}
                      </span>
                      {isWon && (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Staked</p>
                        <p className="font-semibold text-gray-900 dark:text-white">${bet.wager?.amount?.toLocaleString() || 0}</p>
                      </div>

                      {/* Your Shares */}
                      {bet.wager?.shares != null && bet.wager.shares > 0 && (
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">Your Shares</p>
                          <p className="font-semibold text-indigo-600">{bet.wager.shares.toFixed(1)}</p>
                          {bet.wager.sharesDetail && bet.wager.sharesDetail.length > 1 && (
                            <div className="mt-1 space-y-0.5">
                              {bet.wager.sharesDetail.map((sd: any, i: number) => (
                                <p key={i} className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {sd.label}: {parseFloat(sd.shares).toFixed(1)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {myBetsFilter === 'ACTIVE' && (
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">Closes In</p>
                          <p className="font-semibold text-orange-600">
                            {bet.closeTime ? formatTimeLeft(bet.closeTime) : '\u2014'}
                          </p>
                        </div>
                      )}

                      {myBetsFilter === 'PENDING' && (
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">Closed</p>
                          <p className="font-semibold text-yellow-600">
                            {bet.closeTime ? new Date(bet.closeTime).toLocaleDateString() : '\u2014'}
                          </p>
                        </div>
                      )}

                      {myBetsFilter === 'COMPLETED' && (
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">
                            {isWon ? 'Won' : isLost ? 'Lost' : 'Refunded'}
                          </p>
                          <p className={`font-semibold ${isWon ? 'text-emerald-600' : isLost ? 'text-red-600' : 'text-amber-600'}`}>
                            {isWon ? '+' : isLost ? '-' : ''}${bet.wager?.amount?.toLocaleString() || 0}
                          </p>
                        </div>
                      )}

                      {myBetsFilter === 'HISTORY' && (
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">Result</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getWagerStatusBadge(bet.wager?.status)}`}>
                            {bet.wager?.status}
                          </span>
                        </div>
                      )}

                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Category</p>
                        <p className="font-medium text-blue-600 text-xs">{bet.category}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">
                          {myBetsFilter === 'COMPLETED' ? 'Resolved' : 'Placed'}
                        </p>
                        <p className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                          {bet.wager?.createdAt ? new Date(bet.wager.createdAt).toLocaleDateString() : '\u2014'}
                        </p>
                      </div>
                    </div>

                    {/* Trade button for open markets */}
                    {bet.status === 'OPEN' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/bets/${bet.id}`); }}
                        className="mt-3 w-full px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800 border border-blue-200 dark:border-blue-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        Trade / Sell Shares
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
            <span className="w-12 h-12 flex items-center justify-center mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-400">
              {myBetsTabs.find(t => t.key === myBetsFilter)?.icon}
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {myBetsFilter === 'ACTIVE' && 'No active bets'}
              {myBetsFilter === 'PENDING' && 'No bets pending results'}
              {myBetsFilter === 'COMPLETED' && 'No completed bets'}
              {myBetsFilter === 'HISTORY' && (searchQuery ? 'No bets found' : 'No betting history')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {myBetsFilter === 'ACTIVE' && 'Browse available markets to get started!'}
              {myBetsFilter === 'PENDING' && 'No bets are waiting for resolution.'}
              {myBetsFilter === 'COMPLETED' && 'No bets have been resolved yet.'}
              {myBetsFilter === 'HISTORY' && (
                searchQuery ? `No bets match "${searchQuery}".` : 'Place bets to see history here.'
              )}
            </p>
            {(myBetsFilter === 'ACTIVE' || (myBetsFilter === 'HISTORY' && !searchQuery)) && (
              <button
                onClick={() => router.push('/markets')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Browse Markets
              </button>
            )}
            {myBetsFilter === 'HISTORY' && searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      
        {/* ── Bet Details Modal ── */}
        {selectedBetId && (
          <BetDetailsModal
            isOpen={!!selectedBetId}
            onClose={handleCloseBetDetails}
            betId={selectedBetId}
            userWager={selectedUserWager}
          />
        )}
      </div>
    </UserLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
