'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

interface Outcome {
  id: string;
  label: string;
  totalWagers: number;
  totalCoins: number;
  sortOrder: number;
  currentPrice: number;
}

interface Trade {
  id: string;
  side: string;
  shares: number;
  cost: number;
  outcomeIndex: number;
  priceAtTrade: number;
  createdAt: string;
  traderName: string;
}

interface BetDetail {
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
  updatedAt: string;
  resolvedAt: string | null;
  winningOutcomeId: string | null;
  resolutionCriteria: string;
  tags: string[];
  referenceLinks: string[];
  outcomeShares: number[];
  liquidityParam: number;
  lmsrPrices: number[];
  outcomes: Outcome[];
  createdBy: { displayName: string; email: string };
  _count: { wagers: number; comments: number; reports: number; traders: number };
  recentTrades: Trade[];
}

export default function BetDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { admin } = useAuth();

  const [bet, setBet] = useState<BetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Resolution state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [resolving, setResolving] = useState(false);
  const [showEarlyWarning, setShowEarlyWarning] = useState(false);

  // Status change state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    resolutionCriteria: '',
    closeTime: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchBet = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bets/${id}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch bet');
      const data = await response.json();
      setBet(data.data);
      setEditForm({
        title: data.data.title,
        description: data.data.description,
        category: data.data.category,
        resolutionCriteria: data.data.resolutionCriteria || '',
        closeTime: data.data.closeTime ? new Date(data.data.closeTime).toISOString().slice(0, 16) : '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin && id) fetchBet();
  }, [admin, id]);

  const handleResolve = async () => {
    if (!selectedOutcome) {
      toast.error('Please select a winning outcome');
      return;
    }
    setResolving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bets/${id}/resolve`,
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
      fetchBet();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve bet');
    } finally {
      setResolving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;
    setChangingStatus(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bets/${id}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) throw new Error('Failed to update status');
      toast.success(`Status changed to ${newStatus}`);
      setShowStatusModal(false);
      fetchBet();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bets/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: editForm.title,
            description: editForm.description,
            category: editForm.category,
            resolutionCriteria: editForm.resolutionCriteria,
            closeTime: editForm.closeTime ? new Date(editForm.closeTime).toISOString() : undefined,
          }),
        }
      );
      if (!response.ok) throw new Error('Failed to update bet');
      toast.success('Bet updated successfully!');
      setShowEditModal(false);
      fetchBet();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300';
      case 'CLOSED': return 'bg-amber-100 text-amber-800 ring-1 ring-amber-300';
      case 'RESOLVED': return 'bg-blue-100 text-blue-800 dark:text-blue-300 ring-1 ring-blue-300';
      case 'CANCELLED': return 'bg-red-100 text-red-800 ring-1 ring-red-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 ring-1 ring-gray-300';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bet details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !bet) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg">
            <h3 className="font-medium">Error</h3>
            <p className="mt-1">{error || 'Bet not found'}</p>
            <Link href="/admin/bets" className="mt-3 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to bets
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title={bet.title}
        subtitle={`${bet.shortId} · ${bet.category} · ${bet.source === 'AI_GENERATED' ? '🤖 AI Generated' : '✏️ Manual'}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => setShowStatusModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Change Status
            </button>
            {(bet.status === 'OPEN' || bet.status === 'CLOSED') && !bet.winningOutcomeId && (
              <button
                onClick={() => {
                  if (new Date(bet.closeTime) > new Date()) {
                    setShowEarlyWarning(true);
                  } else {
                    setShowResolveModal(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resolve
              </button>
            )}
          </div>
        }
      />

      <div className="p-6 md:p-8 space-y-6 transition-colors duration-300">
        {/* ── Resolution Banner (only when RESOLVED) ── */}
        {bet.status === 'RESOLVED' && bet.winningOutcomeId && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-3xl shrink-0">🏆</div>
              <div className="flex-1">
                <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Market Resolved</p>
                <h3 className="text-2xl font-bold mt-0.5">
                  {bet.outcomes.find(o => o.id === bet.winningOutcomeId)?.label || 'Unknown'}
                </h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-emerald-100">
                  {bet.resolvedAt && (
                    <span>Resolved {new Date(bet.resolvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  )}
                  <span>•</span>
                  <span>${Number(bet.totalPool).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pool distributed</span>
                  <span>•</span>
                  <span>{bet._count.traders} traders settled</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Status + Description + Creator ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info (2/3) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusStyle(bet.status)}`}>
                {bet.status}
              </span>
              {bet.status === 'CLOSED' && new Date(bet.closeTime) < new Date() && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-700 animate-pulse">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                  Expired – Awaiting Resolution
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                bet.source === 'AI_GENERATED'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-700'
                  : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-700'
              }`}>
                {bet.source === 'AI_GENERATED' ? '🤖 AI Generated' : '✏️ Manual'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-700">
                {bet.category}
              </span>
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{bet.description}</p>

            {bet.resolutionCriteria && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mt-4">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Resolution Criteria</p>
                <p className="text-sm text-blue-800 dark:text-blue-300">{bet.resolutionCriteria}</p>
              </div>
            )}

            {bet.tags && bet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {bet.tags.map((tag: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Identifiers */}
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">ID:</span>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded font-mono">{bet.shortId}</code>
              </div>
              {bet.slug && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Slug:</span>
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded font-mono">{bet.slug}</code>
                </div>
              )}
              <button
                onClick={() => { navigator.clipboard.writeText(bet.id); toast.success('Bet ID copied!'); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Copy full ID
              </button>
            </div>
          </div>

          {/* Creator + Quick Info (1/3) */}
          <div className="space-y-4">
            {/* Creator Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 transition-colors duration-300">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Created By</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {(bet.createdBy?.displayName || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{bet.createdBy?.displayName || 'Admin'}</p>
                  <p className="text-xs text-gray-400">{bet.createdBy?.email || '—'}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Created {new Date(bet.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                <p>Last updated {new Date(bet.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </div>
            </div>

            {/* Quick Counts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 transition-colors duration-300">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">💬 Comments</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{bet._count.comments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">🎲 Wagers</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{bet._count.wagers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">📈 Traders</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{bet._count.traders}</span>
                </div>
                {bet._count.reports > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-red-100 dark:border-red-900">
                    <span className="text-sm text-red-500">🚩 Reports</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{bet._count.reports}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Total Pool', value: `$${Number(bet.totalPool).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: '💰', raw: true },
            { label: 'Volume', value: `$${Number(bet.totalVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: '📊', raw: true },
            { label: 'Participants', value: bet.participantCount, icon: '👥' },
            { label: 'Outcomes', value: bet.outcomes.length, icon: '🎯' },
            { label: 'Liquidity (b)', value: bet.liquidityParam || '—', icon: '💧' },
            { label: 'Total Trades', value: bet.recentTrades.length, icon: '🔄' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stat.raw ? stat.value : (typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Outcomes with LMSR Prices */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Outcomes & LMSR State</h2>
          
          {bet.liquidityParam && (
            <div className="mb-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Liquidity Parameter (b): <strong className="text-gray-900 dark:text-white">{bet.liquidityParam}</strong></span>
            </div>
          )}

          <div className="space-y-3">
            {bet.outcomes.map((outcome, i) => {
              const price = bet.lmsrPrices[i];
              const isWinner = bet.winningOutcomeId === outcome.id;
              const shares = bet.outcomeShares ? (typeof bet.outcomeShares === 'string' ? JSON.parse(bet.outcomeShares as any) : bet.outcomeShares)[i] : 0;
              return (
                <div
                  key={outcome.id}
                  className={`rounded-xl border p-4 ${isWinner ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {isWinner && <span className="text-lg">🏆</span>}
                      <span className="font-semibold text-gray-900 dark:text-white">{outcome.label}</span>
                    </div>
                    {price !== undefined && (
                      <span className="text-lg font-bold text-indigo-600">{(price * 100).toFixed(1)}%</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Wagers: <strong className="text-gray-700 dark:text-gray-300">{outcome.totalWagers}</strong></span>
                    <span>Staked: <strong className="text-gray-700 dark:text-gray-300">${Number(outcome.totalCoins).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                    <span>Shares: <strong className="text-gray-700 dark:text-gray-300">{Number(shares).toFixed(2)}</strong></span>
                  </div>
                  {price !== undefined && (
                    <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isWinner ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${(price * 100).toFixed(1)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Visual Timeline ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Timeline</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-6">
              {/* Created */}
              <div className="flex items-start gap-4 relative">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 z-10 ring-4 ring-white dark:ring-gray-800">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <div className="pt-1.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Created</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(bet.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  <p className="text-xs text-gray-400">by {bet.createdBy?.displayName || 'Admin'}</p>
                </div>
              </div>

              {/* Close Time */}
              <div className="flex items-start gap-4 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white dark:ring-gray-800 ${
                  new Date(bet.closeTime) < new Date()
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  <svg className={`w-5 h-5 ${
                    new Date(bet.closeTime) < new Date()
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="pt-1.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Market Close</p>
                  <p className={`text-sm ${
                    new Date(bet.closeTime) < new Date()
                      ? 'text-red-600 dark:text-red-400 font-semibold'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {new Date(bet.closeTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    {new Date(bet.closeTime) < new Date() && ' (Expired)'}
                  </p>
                </div>
              </div>

              {/* Resolved (if applicable) */}
              {bet.resolvedAt && (
                <div className="flex items-start gap-4 relative">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 z-10 ring-4 ring-white dark:ring-gray-800">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="pt-1.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Resolved</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {new Date(bet.resolvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {bet.winningOutcomeId && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Winner: {bet.outcomes.find(o => o.id === bet.winningOutcomeId)?.label}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              <div className="flex items-start gap-4 relative">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 z-10 ring-4 ring-white dark:ring-gray-800">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                </div>
                <div className="pt-1.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Last Updated</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(bet.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        {bet.recentTrades.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Trades</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-600">
                    <th className="pb-3 pr-4">Trader</th>
                    <th className="pb-3 pr-4">Side</th>
                    <th className="pb-3 pr-4">Outcome</th>
                    <th className="pb-3 pr-4">Shares</th>
                    <th className="pb-3 pr-4">Cost</th>
                    <th className="pb-3 pr-4">Price</th>
                    <th className="pb-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {bet.recentTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{trade.traderName || 'Unknown'}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          trade.side === 'BUY' ? 'bg-emerald-100 text-emerald-700' :
                          trade.side === 'SELL' ? 'bg-red-100 text-red-700 dark:text-red-400' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{bet.outcomes[trade.outcomeIndex]?.label || `#${trade.outcomeIndex}`}</td>
                      <td className="py-3 pr-4 font-mono">{trade.shares.toFixed(2)}</td>
                      <td className="py-3 pr-4 font-mono">${trade.cost.toFixed(2)}</td>
                      <td className="py-3 pr-4 font-mono">{(trade.priceAtTrade * 100).toFixed(1)}%</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">{new Date(trade.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reference Links */}
        {bet.referenceLinks && bet.referenceLinks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Reference Links</h2>
            <ul className="space-y-2">
              {bet.referenceLinks.map((link: string, i: number) => (
                <li key={i}>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Early Resolution Warning Modal ── */}
      {showEarlyWarning && bet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEarlyWarning(false)} />
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
                <strong>&ldquo;{bet.title}&rdquo;</strong> is scheduled to close on{' '}
                <strong>{new Date(bet.closeTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong>.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                Resolving early will immediately close the market, settle all positions, and prevent further trading. This action <strong>cannot be undone</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEarlyWarning(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowEarlyWarning(false); setShowResolveModal(true); }}
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
      {showResolveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !resolving && setShowResolveModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Resolve Bet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select the winning outcome. This action cannot be undone.</p>
            <div className="space-y-2 mb-6">
              {bet.outcomes.map((outcome) => (
                <label
                  key={outcome.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedOutcome === outcome.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="winningOutcome"
                    value={outcome.id}
                    checked={selectedOutcome === outcome.id}
                    onChange={(e) => setSelectedOutcome(e.target.value)}
                    className="text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">{outcome.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
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

      {/* ── Status Change Modal ── */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !changingStatus && setShowStatusModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Change Status</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Current status: <strong>{bet.status}</strong></p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-6 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select new status...</option>
              {['OPEN', 'CLOSED', 'CANCELLED'].filter(s => s !== bet.status).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={changingStatus}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={changingStatus || !newStatus}
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {changingStatus ? 'Updating…' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setShowEditModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Bet</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {['SPORTS', 'POLITICS', 'ENTERTAINMENT', 'TECHNOLOGY', 'CULTURE', 'OTHER'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution Criteria</label>
                <textarea
                  value={editForm.resolutionCriteria}
                  onChange={(e) => setEditForm(p => ({ ...p, resolutionCriteria: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Close Time</label>
                <input
                  type="datetime-local"
                  value={editForm.closeTime}
                  onChange={(e) => setEditForm(p => ({ ...p, closeTime: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
