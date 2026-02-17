'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

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
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h3 className="font-medium">Error Loading Dashboard</h3>
          <p className="mt-1">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to WeBet Admin Panel</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <Link href="/admin/ai-bets" className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-8 text-white hover:shadow-lg transition-shadow w-full h-44 flex items-center justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Review AI Bets</h3>
              <p className="text-sm text-indigo-100 mt-1">{stats?.pendingAI || 0} bets pending review</p>
            </div>
            <div className="ml-6 bg-white bg-opacity-20 rounded-md p-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/>
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
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
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
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Link href="/admin/bets" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalBets || 0}</p>
          <p className="text-sm text-gray-600">Total Bets</p>
        </Link>

        <Link href="/admin/ai-bets" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.pendingAI || 0}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </Link>

        {/* Approved card removed per request */}

        <Link href="/admin/bets?status=OPEN" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.publishedBets || 0}</p>
          <p className="text-sm text-gray-600">Published</p>
        </Link>

        <Link href="/admin/ai-suggestions?status=REJECTED" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.rejectedAI || 0}</p>
          <p className="text-sm text-gray-600">Rejected</p>
        </Link>

        <Link href="/admin/bets?status=CLOSED" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.expiredBets || 0}</p>
          <p className="text-sm text-gray-600">Closed</p>
        </Link>
      </div>

      {/* Bets by Source */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bets by Source</h3>
        <div className="grid grid-cols-2 gap-8">
          <Link href="/admin/bets?source=AI_GENERATED" className="text-center hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
              </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.aiGenerated || 0}</p>
            <p className="text-sm text-gray-600">AI Generated</p>
          </Link>
          
          <Link href="/admin/bets?source=MANUAL" className="text-center hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 14.5V18h3.5L17.8 5.7l-3.5-3.5L2 14.5zM20.7 7.3a1 1 0 010 1.4l-2.4 2.4-3.5-3.5 2.4-2.4a1 1 0 011.4 0l2.1 2.1z" />
                </svg>
              </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.manuallyCreated || 0}</p>
            <p className="text-sm text-gray-600">Manually Created</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}