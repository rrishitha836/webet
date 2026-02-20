'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  participantCount: number;
  createdAt: string;
  outcomes: { id: string; label: string; totalWagers: number; totalCoins: number }[];
  createdBy: { displayName: string; email: string };
  _count: { wagers: number; comments: number; reports: number };
}

export default function AdminBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, cursor: null, hasMore: false });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const { admin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filters from URL
  const categoryFilter = searchParams.get('category') || 'ALL';
  const statusFilter = searchParams.get('status') || 'ALL';
  const sourceFilter = searchParams.get('source') || 'ALL';

  const fetchBets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (sourceFilter !== 'ALL') params.append('source', sourceFilter);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bets?${params.toString()}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch bets');

      const data = await response.json();
      
      setBets(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bets');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, sourceFilter]);

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
      case 'OPEN': return { bg: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' };
      case 'CLOSED': return { bg: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-500' };
      case 'RESOLVED': return { bg: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', dot: 'bg-blue-500' };
      case 'CANCELLED': return { bg: 'bg-red-50 text-red-700 ring-1 ring-red-200', dot: 'bg-red-500' };
      default: return { bg: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200', dot: 'bg-gray-500' };
    }
  };

  const getSourceStyle = (source: string) => {
    return source === 'AI_GENERATED'
      ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
      : 'bg-sky-50 text-sky-700 ring-1 ring-sky-200';
  };

  const getCategoryStyle = () => 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200';

  const getOutcomeStyle = (index: number) => {
    const styles = [
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-amber-50 text-amber-700 border-amber-200',
    ];
    return styles[index % styles.length];
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
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
          <p className="mt-4 text-sm text-gray-500">Loading bets…</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
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
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No bets found</h3>
              <p className="text-gray-400 text-sm mb-5">Try adjusting your filters or create a new bet.</p>
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
              return viewMode === 'list' ? (
              /* ─── LIST VIEW CARD ─── */
              <Link key={bet.id} href={`/admin/bets/${bet.id}`} className="block bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-7 group">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {bet.status}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getSourceStyle(bet.source)}`}>
                    {bet.source === 'AI_GENERATED' ? '🤖 AI Generated' : '✏️ Manual'}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getCategoryStyle()}`}>
                    {bet.category}
                  </span>
                </div>

                {/* Title + Description */}
                <h3 className="text-xl font-semibold text-gray-900 leading-snug mb-2 group-hover:text-indigo-700 transition-colors">{bet.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-2">{bet.description}</p>

                {/* Metadata Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{bet.totalPool}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pool</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 flex items-center gap-3">
                    <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{bet.participantCount}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Participants</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 flex items-center gap-3">
                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{new Date(bet.closeTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Closes</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 flex items-center gap-3">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{new Date(bet.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Created</p>
                    </div>
                  </div>
                </div>

                {/* Outcomes + Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-5 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {bet.outcomes.map((outcome, oi) => (
                      <span
                        key={outcome.id}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${getOutcomeStyle(oi)}`}
                      >
                        {outcome.label}
                        <span className="opacity-50">·</span>
                        <span>{outcome.totalWagers} wagers</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">
                    {bet._count.wagers} wagers · {bet._count.comments} comments · by {bet.createdBy?.displayName || 'Admin'}
                  </p>
                </div>
              </Link>
              ) : (
              /* ─── GRID VIEW CARD ─── */
              <Link key={bet.id} href={`/admin/bets/${bet.id}`} className="block bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-6 sm:p-7 flex flex-col group">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyle.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {bet.status}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getSourceStyle(bet.source)}`}>
                    {bet.source === 'AI_GENERATED' ? '🤖 AI' : '✏️ Manual'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getCategoryStyle()}`}>
                    {bet.category}
                  </span>
                </div>

                {/* Title + Description */}
                <h3 className="text-lg font-semibold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-indigo-700 transition-colors">{bet.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-5">{bet.description}</p>

                {/* 2x2 Stat Boxes */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{bet.totalPool}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pool</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{bet.participantCount}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Participants</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{new Date(bet.closeTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Closes</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{new Date(bet.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Created</p>
                    </div>
                  </div>
                </div>

                {/* Outcomes */}
                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100">
                  {bet.outcomes.map((outcome, oi) => (
                    <span key={outcome.id} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${getOutcomeStyle(oi)}`}>
                      {outcome.label} <span className="opacity-50">·</span> {outcome.totalWagers}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <p className="mt-3 text-xs text-gray-400">
                  {bet._count.wagers} wagers · {bet._count.comments} comments · by {bet.createdBy?.displayName || 'Admin'}
                </p>
              </Link>
              );
            })}
            </div>
          )}
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
