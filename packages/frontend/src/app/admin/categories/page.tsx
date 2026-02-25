'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ViewToggle from '@/components/ui/ViewToggle';

interface CategoryStats {
  category: string;
  count: number;
  activeCount: number;
  resolvedCount: number;
}

interface BetCounts {
  totalBets: number;
  activeBets: number;
  resolvedBets: number;
  categoryStats: CategoryStats[];
}

// Auto-assign icon/color based on category name
const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
  SPORTS: { icon: '⚽', color: 'bg-green-100 text-green-700' },
  POLITICS: { icon: '🏛️', color: 'bg-blue-100 text-blue-700' },
  ENTERTAINMENT: { icon: '🎬', color: 'bg-purple-100 text-purple-700' },
  TECHNOLOGY: { icon: '💻', color: 'bg-gray-100 text-gray-700' },
  CULTURE: { icon: '🎨', color: 'bg-pink-100 text-pink-700' },
  OTHER: { icon: '📋', color: 'bg-yellow-100 text-yellow-700' },
  SCIENCE: { icon: '🔬', color: 'bg-teal-100 text-teal-700' },
  FINANCE: { icon: '💰', color: 'bg-amber-100 text-amber-700' },
  GAMING: { icon: '🎮', color: 'bg-indigo-100 text-indigo-700' },
  HEALTH: { icon: '🏥', color: 'bg-red-100 text-red-700' },
  CRYPTO: { icon: '₿', color: 'bg-orange-100 text-orange-700' },
  WORLD: { icon: '🌍', color: 'bg-cyan-100 text-cyan-700' },
};

const DEFAULT_STYLE = { icon: '📂', color: 'bg-slate-100 text-slate-700' };

function getCategoryStyle(name: string) {
  return CATEGORY_STYLES[name.toUpperCase()] || DEFAULT_STYLE;
}

export default function CategoriesPage() {
  const [categoryData, setCategoryData] = useState<BetCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { admin } = useAuth();

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/stats`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch category data');
      }

      const data = await response.json();
      setCategoryData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchCategoryData();
    }
  }, [admin]);

  return (
    <AdminLayout>
      <AdminPageHeader 
        title="Categories" 
        subtitle="Manage and view betting categories with statistics"
        actions={<ViewToggle view={viewMode} onChange={setViewMode} />}
      />
      
      <div className="p-8">
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {categoryData && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Bets</p>
                  <p className="text-3xl font-bold text-gray-900">{categoryData.totalBets}</p>
                </div>
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Active Bets</p>
                  <p className="text-3xl font-bold text-green-600">{categoryData.activeBets}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Resolved Bets</p>
                  <p className="text-3xl font-bold text-blue-600">{categoryData.resolvedBets}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid / List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {categoryData.categoryStats.map((stats) => {
              const style = getCategoryStyle(stats.category);
              return viewMode === 'grid' ? (
                <div key={stats.category} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer group">
                  <div className={`${style.color} px-6 py-5`}>
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{style.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold">{stats.category}</h3>
                        <p className="text-sm opacity-70">
                          {stats.count} total bet{stats.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
                        <p className="text-lg font-bold text-green-600">{stats.activeCount}</p>
                        <p className="text-[10px] font-semibold text-green-600/60 uppercase tracking-wider mt-0.5">Active</p>
                      </div>
                      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                        <p className="text-lg font-bold text-blue-600">{stats.resolvedCount}</p>
                        <p className="text-[10px] font-semibold text-blue-600/60 uppercase tracking-wider mt-0.5">Resolved</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{stats.count}</p>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Total</p>
                      </div>
                    </div>

                    <Link
                      href={`/admin/bets?category=${stats.category}`}
                      className="block w-full text-center bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 py-2.5 rounded-xl transition-colors text-sm font-semibold border border-gray-200 hover:border-indigo-200"
                    >
                      View Bets →
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  key={stats.category}
                  href={`/admin/bets?category=${stats.category}`}
                  className="block bg-white rounded-2xl border border-gray-200/80 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${style.color} flex items-center justify-center text-xl shrink-0`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{stats.category}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stats.count} total bet{stats.count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-5 shrink-0">
                      <div className="text-center px-3 py-1.5 rounded-lg bg-green-50 border border-green-100">
                        <p className="font-bold text-green-600 text-sm">{stats.activeCount}</p>
                        <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wider">Active</p>
                      </div>
                      <div className="text-center px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="font-bold text-blue-600 text-sm">{stats.resolvedCount}</p>
                        <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">Resolved</p>
                      </div>
                      <div className="text-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{stats.count}</p>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-gray-400 group-hover:text-indigo-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-6 sm:p-8 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/bets/create"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Create New Bet
              </Link>
              
              <Link
                href="/admin/ai-bets"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
                Review AI Bets
              </Link>
              
              <button
                onClick={fetchCategoryData}
                className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                Refresh Data
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </AdminLayout>
  );
}