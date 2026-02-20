'use client';

import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { admin } = useAuth();

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        params.append('limit', '50');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params.toString()}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (admin) {
      fetchUsers();
    }
  }, [admin, searchTerm, statusFilter]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
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
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
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
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
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
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {user.displayName}
                  </h3>
                  {user.isSuspended && (
                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate mb-3">{user.email}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-md px-3 py-2">
                    <p className="text-xs text-blue-600 font-medium">Total Bets</p>
                    <p className="text-lg font-bold text-blue-900">{user.totalBets}</p>
                  </div>
                  <div className="bg-green-50 rounded-md px-3 py-2">
                    <p className="text-xs text-green-600 font-medium">Wins</p>
                    <p className="text-lg font-bold text-green-900">{user.totalWins}</p>
                  </div>
                </div>

                {/* Balance */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Balance</span>
                    <span className="text-sm font-semibold text-gray-900">
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
            className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all p-4 flex items-center gap-4"
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
                <h3 className="text-sm font-semibold text-gray-900 truncate">{user.displayName}</h3>
                {user.isSuspended && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full shrink-0">Suspended</span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="hidden sm:flex items-center gap-6 shrink-0 text-sm">
              <div className="text-center">
                <p className="text-xs text-gray-400">Bets</p>
                <p className="font-semibold text-gray-900">{user.totalBets}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Wins</p>
                <p className="font-semibold text-green-600">{user.totalWins}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Balance</p>
                <p className="font-semibold text-gray-900">${user.balance.toLocaleString()}</p>
              </div>
            </div>
          </Link>
          )
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg">
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
          <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No users registered yet'}
          </p>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
