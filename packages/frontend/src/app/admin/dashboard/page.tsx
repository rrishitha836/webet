'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import BoltIcon from '@mui/icons-material/Bolt';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PeopleIcon from '@mui/icons-material/People';
import ReportIcon from '@mui/icons-material/Report';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface DashboardStats {
  totalBets: number;
  activeBets: number;
  publishedAIBets: number;
  pendingAI: number;
  approvedAI: number;
  publishedBets: number;
  rejectedAI: number;
  expiredBets: number;
  aiGenerated: number;
  manuallyCreated: number;
  totalUsers: number;
  activeUsers: number;
  totalWagers: number;
  pendingReports: number;
  totalCoinsInCirculation: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { admin } = useAuth();

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (admin) {
      fetchStats();
    }
  }, [admin]);

  if (loading) {
    return (
      <AdminLayout>
        <AdminPageHeader title="Dashboard" subtitle="Welcome to WeBet Admin Panel" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <AdminPageHeader title="Dashboard" subtitle="Welcome to WeBet Admin Panel" />
        <div className="p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg">
            <h3 className="font-medium">Error Loading Dashboard</h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Compute distribution for the bar chart
  const aiPct = stats && stats.totalBets > 0 ? (stats.aiGenerated / stats.totalBets * 100) : 0;
  const manualPct = 100 - aiPct;

  return (
    <AdminLayout>
      <AdminPageHeader title="Dashboard" subtitle="Welcome to WeBet Admin Panel" />
      <div className="px-6 md:px-8 py-6 space-y-8">

      {/* ── Row 1: Key Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Link href="/admin/bets?status=OPEN" className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.activeBets || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Bets</p>
        </Link>

        <Link href="/admin/bets?source=AI_GENERATED&status=OPEN" className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.publishedAIBets || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Published (AI)</p>
        </Link>

        <Link href="/admin/ai-bets" className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.pendingAI || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pending AI</p>
        </Link>

        <Link href="/admin/users" className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
            <PeopleIcon sx={{ fontSize: 20, color: '#4f46e5' }} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Users</p>
        </Link>

        <Link href="/admin/reports" className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${(stats?.pendingReports || 0) > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <ReportIcon sx={{ fontSize: 20, color: (stats?.pendingReports || 0) > 0 ? '#dc2626' : '#6b7280' }} />
          </div>
          <p className={`text-2xl font-bold ${(stats?.pendingReports || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{stats?.pendingReports || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pending Reports</p>
        </Link>

        <Link href="/admin/bets?status=CLOSED" className={`rounded-xl p-4 text-center hover:shadow-md transition-all duration-300 border ${
          (stats?.expiredBets || 0) > 0
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 ring-2 ring-orange-200 dark:ring-orange-800'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${
            (stats?.expiredBets || 0) > 0
              ? 'bg-orange-100 dark:bg-orange-900/30'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <HourglassTopIcon sx={{ fontSize: 20, color: (stats?.expiredBets || 0) > 0 ? '#ea580c' : '#4b5563' }} />
          </div>
          <p className={`text-2xl font-bold ${(stats?.expiredBets || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>{stats?.expiredBets || 0}</p>
          <p className={`text-xs font-medium ${(stats?.expiredBets || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>Awaiting Resolution</p>
        </Link>
      </div>

      {/* ── Expired Bets Alert ── */}
      {(stats?.expiredBets || 0) > 0 && (
        <Link
          href="/admin/bets?status=CLOSED"
          className="block bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300">
                {stats?.expiredBets} {stats?.expiredBets === 1 ? 'Bet' : 'Bets'} Awaiting Resolution
              </h3>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                These markets have expired and need a winning outcome selected. Click to review and resolve.
              </p>
            </div>
            <svg className="w-5 h-5 text-orange-400 dark:text-orange-500 group-hover:translate-x-1 transition-transform shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      )}

      {/* ── Row 2: Financial + Activity Overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dollars in Circulation</h3>
            <AccountBalanceWalletIcon sx={{ fontSize: 24, color: '#f59e0b' }} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">${(stats?.totalCoinsInCirculation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Total balance across all users</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Wagers</h3>
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{(stats?.totalWagers || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Legacy fixed-pool wagers placed</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Users</h3>
            <PeopleIcon sx={{ fontSize: 24, color: '#10b981' }} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.activeUsers || 0}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Non-suspended accounts</p>
        </div>
      </div>

      {/* ── Row 3: Bet Sources + AI Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Bet Source Distribution</h3>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">AI Generated ({stats?.aiGenerated || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Manual ({stats?.manuallyCreated || 0})</span>
            </div>
          </div>
          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
            <div className="bg-purple-500 h-full transition-all" style={{ width: `${aiPct}%` }}></div>
            <div className="bg-blue-500 h-full transition-all" style={{ width: `${manualPct}%` }}></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{aiPct.toFixed(0)}% AI</span>
            <span>{manualPct.toFixed(0)}% Manual</span>
          </div>
          <div className="flex gap-3 mt-5">
            <Link href="/admin/bets?source=AI_GENERATED" className="flex-1 text-center py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
              View AI Bets →
            </Link>
            <Link href="/admin/bets?source=MANUAL" className="flex-1 text-center py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              View Manual →
            </Link>
          </div>
        </div>

        {/* AI Pipeline Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">AI Pipeline</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                Pending Review
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{stats?.pendingAI || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Approved
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{stats?.approvedAI || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                Rejected
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{stats?.rejectedAI || 0}</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link href="/admin/ai-bets" className="block w-full text-center py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg text-sm font-medium transition-colors">
              Review AI Suggestions →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Row 4: Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/bets/create" className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow group">
          <svg className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <p className="text-sm font-semibold">Create New Bet</p>
          <p className="text-xs opacity-70 mt-0.5">Add a manual betting market</p>
        </Link>
        <Link href="/admin/ai-bets" className="bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow group">
          <BoltIcon sx={{ fontSize: 32, opacity: 0.8 }} className="mb-3 group-hover:opacity-100 transition-opacity" />
          <p className="text-sm font-semibold">AI Agent</p>
          <p className="text-xs opacity-70 mt-0.5">Generate bets with AI</p>
        </Link>
        <Link href="/admin/reports" className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow group">
          <ReportIcon sx={{ fontSize: 32, opacity: 0.8 }} className="mb-3 group-hover:opacity-100 transition-opacity" />
          <p className="text-sm font-semibold">Reports</p>
          <p className="text-xs opacity-70 mt-0.5">{stats?.pendingReports || 0} pending reviews</p>
        </Link>
        <Link href="/admin/audit-log" className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-5 text-white hover:shadow-lg transition-shadow group">
          <svg className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm font-semibold">Audit Log</p>
          <p className="text-xs opacity-70 mt-0.5">View admin activity</p>
        </Link>
      </div>

      </div>
    </AdminLayout>
  );
}