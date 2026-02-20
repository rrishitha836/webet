'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import BoltIcon from '@mui/icons-material/Bolt';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';

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
      <div className="px-6 md:px-8 py-6">

      {/* Stats Cards */}
      {/* Desktop: single 5-col row | Mobile: Total Bets full-width, then 2x2 grid */}
      <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
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
            <HourglassTopIcon sx={{ fontSize: 20, color: '#4b5563' }} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.expiredBets || 0}</p>
          <p className="text-sm text-gray-600">Closed</p>
        </Link>
      </div>

      {/* Mobile Stats Layout */}
      <div className="flex flex-col gap-4 mb-8 md:hidden">
        {/* Row 1: Total Bets - full width */}
        <Link href="/admin/bets" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalBets || 0}</p>
          <p className="text-sm text-gray-600">Total Bets</p>
        </Link>
        {/* Row 2: Pending + Published */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/admin/ai-bets" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.pendingAI || 0}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </Link>
          <Link href="/admin/bets?status=OPEN" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.publishedBets || 0}</p>
            <p className="text-sm text-gray-600">Published</p>
          </Link>
        </div>
        {/* Row 3: Rejected + Closed */}
        <div className="grid grid-cols-2 gap-4">
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
              <HourglassTopIcon sx={{ fontSize: 20, color: '#4b5563' }} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.expiredBets || 0}</p>
            <p className="text-sm text-gray-600">Closed</p>
          </Link>
        </div>
      </div>

      {/* Bets by Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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