'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    return source === 'AI_GENERATED' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">{pagination.total} bets found</p>
        </div>
        <Link
          href="/admin/bets/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          Create New Bet
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Bets List */}
      {!loading && !error && (
        <div className="space-y-4">
          {bets.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bets found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or create a new bet.</p>
              <Link
                href="/admin/bets/create"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create New Bet
              </Link>
            </div>
          ) : (
            bets.map((bet) => (
              <div key={bet.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{bet.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{bet.description}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bet.status)}`}>
                      {bet.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(bet.source)}`}>
                      {bet.source === 'AI_GENERATED' ? 'AI' : 'Manual'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-medium">{bet.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pool</p>
                    <p className="text-sm font-medium">{bet.totalPool} coins</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Participants</p>
                    <p className="text-sm font-medium">{bet.participantCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Closes</p>
                    <p className="text-sm font-medium">
                      {new Date(bet.closeTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Created by {bet.createdBy?.displayName || 'Unknown'} • {new Date(bet.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-500">
                      {bet._count.wagers} wagers • {bet._count.comments} comments
                    </span>
                  </div>
                </div>

                {/* Outcomes */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Outcomes:</p>
                  <div className="flex flex-wrap gap-2">
                    {bet.outcomes.map((outcome) => (
                      <span
                        key={outcome.id}
                        className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {outcome.label} ({outcome.totalWagers} wagers)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </AdminLayout>
  );
}
