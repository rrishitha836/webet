'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import BoltIcon from '@mui/icons-material/Bolt';

interface DashboardStats {
  totalBets: number;
  pendingAI: number;
  approvedAI: number;
  publishedBets: number;
  rejectedAI: number;
  expiredBets: number;
  aiGenerated: number;
  manuallyCreated: number;
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
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h3 className="font-medium">Error Loading Dashboard</h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader title="Dashboard" subtitle="Welcome to WeBet Admin Panel" />
      <div className="p-8">

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <Link href="/admin/ai-bets" className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-8 text-white hover:shadow-lg transition-shadow w-full h-44 flex items-center justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Review AI Bets</h3>
              <p className="text-sm text-indigo-100 mt-1">{stats?.pendingAI || 0} bets pending review</p>
            </div>
            <div className="ml-6 bg-white bg-opacity-20 rounded-md p-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            </div>
          </div>
        </Link>

  <Link href="/admin/bets/create" className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-8 text-white hover:shadow-lg transition-shadow w-full h-44 flex items-center justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Create New Bet</h3>
              <p className="text-sm text-teal-100 mt-1">Manually create a bet</p>
            </div>
            <div className="ml-6 bg-white bg-opacity-20 rounded-md p-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            </div>
          </div>
        </Link>

  <Link href="/admin/categories" className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-8 text-white hover:shadow-lg transition-shadow w-full h-44 flex items-center justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">View Categories</h3>
              <p className="text-sm text-amber-100 mt-1">Manage bet categories</p>
            </div>
            <div className="ml-6 bg-white bg-opacity-20 rounded-md p-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Link href="/admin/bets" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalBets || 0}</p>
          <p className="text-sm text-gray-600">Total Bets</p>
        </Link>

        <Link href="/admin/ai-bets" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.pendingAI || 0}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </Link>

        {/* Approved card removed per request */}

        <Link href="/admin/bets?status=OPEN" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.publishedBets || 0}</p>
          <p className="text-sm text-gray-600">Published</p>
        </Link>

        <Link href="/admin/ai-suggestions?status=REJECTED" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.rejectedAI || 0}</p>
          <p className="text-sm text-gray-600">Rejected</p>
        </Link>

        <Link href="/admin/bets?status=CLOSED" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.expiredBets || 0}</p>
          <p className="text-sm text-gray-600">Closed</p>
        </Link>
      </div>

      {/* Bets by Source - Separate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Generated Card */}
        <Link href="/admin/bets?source=AI_GENERATED" className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">AI Generated Bets</h3>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BoltIcon sx={{ fontSize: 26, color: '#9333ea' }} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-gray-900">{stats?.aiGenerated || 0}</p>
            <p className="text-sm text-gray-500">total bets</p>
          </div>
          <p className="text-sm text-purple-600 mt-3 flex items-center gap-1">
            View all AI bets
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </p>
        </Link>

        {/* Manually Created Card */}
        <Link href="/admin/bets?source=MANUAL" className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Manually Created Bets</h3>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-gray-900">{stats?.manuallyCreated || 0}</p>
            <p className="text-sm text-gray-500">total bets</p>
          </div>
          <p className="text-sm text-blue-600 mt-3 flex items-center gap-1">
            View all manual bets
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </p>
        </Link>
      </div>
      </div>
    </AdminLayout>
  );
}