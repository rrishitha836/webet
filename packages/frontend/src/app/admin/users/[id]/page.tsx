'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

interface UserDetail {
  user: {
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
  };
  stats: {
    totalStaked: number;
    wonBets: number;
    lostBets: number;
    activeBets: number;
  };
  recentBets: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    endDate: string;
    totalPool: number;
    userStake: number;
    createdAt: string;
  }>;
  recentPositions: Array<{
    id: string;
    betId: string;
    betTitle: string;
    betStatus: string;
    optionId: string;
    optionTitle: string;
    amount: number;
    createdAt: string;
  }>;
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suspending, setSuspending] = useState(false);
  const { admin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${params.id}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        setUserDetail(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    if (admin) {
      fetchUserDetail();
    }
  }, [admin, params.id]);

  const handleSuspendToggle = async () => {
    if (!userDetail) return;

    try {
      setSuspending(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${params.id}/suspend`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            suspended: !userDetail.user.isSuspended,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Refresh user data
      setUserDetail({
        ...userDetail,
        user: {
          ...userDetail.user,
          isSuspended: !userDetail.user.isSuspended,
        },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setSuspending(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      OPEN: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !userDetail) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h3 className="font-medium">Error Loading User</h3>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="mt-4 text-sm underline"
          >
            Back to Users
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { user, stats, recentBets, recentPositions } = userDetail;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-indigo-600 hover:text-indigo-700 mb-2 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl">
                {getInitials(user.displayName)}
              </div>
            )}

            {/* User Details */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{user.displayName}</h2>
                {user.isSuspended && (
                  <span className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full font-medium">
                    Suspended
                  </span>
                )}
                {user.role === 'ADMIN' && (
                  <span className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full font-medium">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-1">{user.email}</p>
              <p className="text-sm text-gray-500">
                Joined {formatDate(user.createdAt)}
              </p>
              {user.lastLoginAt && (
                <p className="text-sm text-gray-500">
                  Last login: {formatDate(user.lastLoginAt)}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={handleSuspendToggle}
            disabled={suspending}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              user.isSuspended
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } disabled:opacity-50`}
          >
            {suspending
              ? 'Updating...'
              : user.isSuspended
              ? 'Unsuspend User'
              : 'Suspend User'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ${user.balance.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Staked</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalStaked.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Won Bets</p>
              <p className="text-2xl font-bold text-green-600">{stats.wonBets}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Bets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeBets}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bets</h3>
        {recentBets.length > 0 ? (
          <div className="space-y-3">
            {recentBets.slice(0, 10).map((bet) => (
              <Link
                key={bet.id}
                href={`/admin/bets/${bet.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{bet.title}</h4>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(
                          bet.status
                        )}`}
                      >
                        {bet.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                      {bet.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>User staked: ${bet.userStake.toLocaleString()}</span>
                      <span>Total pool: ${bet.totalPool.toLocaleString()}</span>
                      <span>Ends: {formatDate(bet.endDate)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No bets found</p>
        )}
      </div>

      {/* Recent Positions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Positions</h3>
        {recentPositions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Bet
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Option
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                    Amount
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentPositions.slice(0, 20).map((position) => (
                  <tr key={position.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {position.betTitle}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {position.optionTitle}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      ${position.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(
                          position.betStatus
                        )}`}
                      >
                        {position.betStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 text-right">
                      {formatDate(position.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No positions found</p>
        )}
      </div>
    </AdminLayout>
  );
}
