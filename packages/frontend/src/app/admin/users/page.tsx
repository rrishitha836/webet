'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ViewToggle from '@/components/ui/ViewToggle';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  balance: number;
  role: string;
  isSuspended: boolean;
  totalBets: number;
  totalWins: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const { admin } = useAuth();
  const isFirstRender = useRef(true);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users
  const fetchUsers = useCallback(async (isInitial: boolean, paginationCursor?: string) => {
    try {
      if (isInitial) setInitialLoading(true);
      if (paginationCursor) setLoadingMore(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paginationCursor) params.append('cursor', paginationCursor);
      params.append('limit', '20');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params.toString()}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      if (paginationCursor) {
        setUsers(prev => [...prev, ...data.data]);
      } else {
        setUsers(data.data);
      }
      setHasMore(data.pagination?.hasMore || data.data.length === 20);
      setCursor(data.pagination?.cursor || (data.data.length > 0 ? data.data[data.data.length - 1].id : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      if (isInitial) setInitialLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (admin) {
      const isInitial = isFirstRender.current;
      isFirstRender.current = false;
      fetchUsers(isInitial);
    }
  }, [admin, fetchUsers]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg">
          <h3 className="font-medium">Error Loading Users</h3>
          <p className="mt-1">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Users"
        subtitle="Manage and view all registered users"
        actions={<ViewToggle view={viewMode} onChange={setViewMode} />}
      />

      <div className="p-8">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm dark:shadow-none dark:border dark:border-gray-700 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="h-[42px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full h-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Grid / List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
        {users.map((user) => (
          viewMode === 'grid' ? (
          <Link
            key={user.id}
            href={`/admin/users/${user.id}`}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 duration-300"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {getInitials(user.displayName)}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {user.displayName}
                  </h3>
                  {user.isSuspended && (
                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-3">{user.email}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md px-3 py-2">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Bets</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-200">{user.totalBets}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-md px-3 py-2">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">Wins</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-200">{user.totalWins}</p>
                  </div>
                </div>

                {/* Balance */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${user.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
          ) : (
          <Link
            key={user.id}
            href={`/admin/users/${user.id}`}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all p-4 flex items-center gap-4 duration-300"
          >
            <div className="flex-shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials(user.displayName)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.displayName}</h3>
                {user.isSuspended && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full shrink-0">Suspended</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
            <div className="hidden sm:flex items-center gap-6 shrink-0 text-sm">
              <div className="text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">Bets</p>
                <p className="font-semibold text-gray-900 dark:text-white">{user.totalBets}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">Wins</p>
                <p className="font-semibold text-green-600 dark:text-green-400">{user.totalWins}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">Balance</p>
                <p className="font-semibold text-gray-900 dark:text-white">${user.balance.toLocaleString()}</p>
              </div>
            </div>
          </Link>
          )
        ))}
      </div>

      {users.length === 0 && !initialLoading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 transition-colors duration-300">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No users found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No users registered yet'}
          </p>
        </div>
      )}

      {/* Load More */}
      {hasMore && users.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => cursor && fetchUsers(false, cursor)}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : `Load More (${users.length} shown)`}
          </button>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
