'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

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

export default function CategoriesPage() {
  const [categoryData, setCategoryData] = useState<BetCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { admin } = useAuth();

  const categories = [
    { name: 'SPORTS', icon: '⚽', color: 'bg-green-100 text-green-700' },
    { name: 'POLITICS', icon: '🏛️', color: 'bg-blue-100 text-blue-700' },
    { name: 'ENTERTAINMENT', icon: '🎬', color: 'bg-purple-100 text-purple-700' },
    { name: 'TECHNOLOGY', icon: '💻', color: 'bg-gray-100 text-gray-700' },
    { name: 'CULTURE', icon: '🎨', color: 'bg-pink-100 text-pink-700' },
    { name: 'OTHER', icon: '📋', color: 'bg-yellow-100 text-yellow-700' }
  ];

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

  const getCategoryStats = (categoryName: string) => {
    if (!categoryData) return { count: 0, activeCount: 0, resolvedCount: 0 };
    
    const stats = categoryData.categoryStats.find(stat => stat.category === categoryName);
    return stats || { count: 0, activeCount: 0, resolvedCount: 0 };
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories Overview</h1>
        <p className="text-gray-600">Manage and view betting categories with statistics</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {categoryData && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Bets</h3>
              <p className="text-3xl font-bold text-gray-900">{categoryData.totalBets}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Bets</h3>
              <p className="text-3xl font-bold text-green-600">{categoryData.activeBets}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Resolved Bets</h3>
              <p className="text-3xl font-bold text-blue-600">{categoryData.resolvedBets}</p>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const stats = getCategoryStats(category.name);
              return (
                <div key={category.name} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className={`${category.color} px-6 py-4`}>
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                        <p className="text-sm opacity-80">
                          {stats.count} total bet{stats.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Bets</span>
                        <span className="font-semibold text-green-600">{stats.activeCount}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Resolved Bets</span>
                        <span className="font-semibold text-blue-600">{stats.resolvedCount}</span>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total</span>
                          <span className="font-bold text-xl">{stats.count}</span>
                        </div>
                      </div>
                    </div>
                    
                    {stats.count === 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 text-center">
                          No bets in this category yet
                        </p>
                      </div>
                    )}
                    
                    {stats.count > 0 && (
                      <div className="mt-4">
                        <Link
                          href={`/admin/bets?category=${category.name}`}
                          className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
                        >
                          View Bets
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/admin/bets/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Bet
              </Link>
              
              <Link
                href="/admin/ai-bets"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Review AI Bets
              </Link>
              
              <button
                onClick={fetchCategoryData}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}