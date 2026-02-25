"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";

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
  const [error, setError] = useState("");
  const [suspending, setSuspending] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const { admin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${params.id}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }

        const data = await response.json();
        setUserDetail(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user details");
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
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            suspended: !userDetail.user.isSuspended,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      setUserDetail({
        ...userDetail,
        user: {
          ...userDetail.user,
          isSuspended: !userDetail.user.isSuspended,
        },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setSuspending(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      OPEN: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
      CLOSED: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      CANCELLED: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading user details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !userDetail) {
    return (
      <AdminLayout>
        <div className="px-6 md:px-8 py-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg">
            <h3 className="font-medium">Error Loading User</h3>
            <p className="mt-1">{error}</p>
            <button
              onClick={() => router.push("/admin/users")}
              className="mt-4 text-sm underline"
            >
              Back to Users
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { user, stats, recentBets, recentPositions } = userDetail;

  return (
    <>
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Back Link & Page Title */}
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="text-sm text-indigo-600 hover:text-indigo-700 mb-3 inline-flex items-center gap-1 font-medium"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Users
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">User Profile</h1>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-colors duration-300 border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5">
              {/* Avatar */}
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-700 flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl ring-4 ring-indigo-100 dark:ring-indigo-900 flex-shrink-0">
                  {getInitials(user.displayName)}
                </div>
              )}

              {/* User Details */}
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{user.displayName}</h2>
                  {user.isSuspended && (
                    <span className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full font-medium">
                      Suspended
                    </span>
                  )}
                  {user.role === "ADMIN" && (
                    <span className="px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Joined {formatDate(user.createdAt)}
                  </span>
                  {user.lastLoginAt && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Last login {formatDate(user.lastLoginAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 self-center">
              <button
                onClick={() => setShowSuspendModal(true)}
                disabled={suspending}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm ${
                  user.isSuspended
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                } disabled:opacity-50`}
              >
                {suspending
                  ? "Updating..."
                  : user.isSuspended
                  ? "Unsuspend User"
                  : "Suspend User"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-colors duration-300 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Balance</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  ${user.balance.toLocaleString()}
                </p>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-colors duration-300 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Staked</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalStaked.toLocaleString()}
                </p>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-colors duration-300 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Won Bets</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.wonBets}</p>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-colors duration-300 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Active Bets</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.activeBets}</p>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bets */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-colors duration-300 border border-gray-200 dark:border-gray-700 mb-8 overflow-hidden">
          <div className="px-6 sm:px-8 py-5 bg-gray-50/70 dark:bg-gray-700/70 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bets</h3>
          </div>
          <div className="p-6 sm:p-8">
            {recentBets.length > 0 ? (
              <div className="space-y-4">
                {recentBets.slice(0, 10).map((bet) => (
                  <Link
                    key={bet.id}
                    href={`/admin/bets/${bet.id}`}
                    className="block p-4 sm:p-5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">{bet.title}</h4>
                          <span
                            className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${getStatusBadge(
                              bet.status
                            )}`}
                          >
                            {bet.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-1">
                          {bet.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>Staked: <span className="font-medium text-gray-700 dark:text-gray-300">${bet.userStake.toLocaleString()}</span></span>
                          <span>Pool: <span className="font-medium text-gray-700 dark:text-gray-300">${bet.totalPool.toLocaleString()}</span></span>
                          <span>Ends: {formatDate(bet.endDate)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-10">No bets found</p>
            )}
          </div>
        </div>

        {/* Recent Positions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-colors duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 sm:px-8 py-5 bg-gray-50/70 dark:bg-gray-700/70 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Positions</h3>
          </div>
          <div className="p-6 sm:p-8">
            {recentPositions.length > 0 ? (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Bet
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Option
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentPositions.slice(0, 20).map((position) => (
                      <tr key={position.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-4 px-4 text-sm text-gray-900 dark:text-white font-medium">
                          {position.betTitle}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {position.optionTitle}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 dark:text-white text-right font-semibold">
                          ${position.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 text-xs rounded-full font-medium ${getStatusBadge(
                              position.betStatus
                            )}`}
                          >
                            {position.betStatus}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                          {formatDate(position.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-10">No positions found</p>
            )}
          </div>
        </div>
      </div>

    </AdminLayout>


      {/* Suspend / Unsuspend Confirmation Modal */}
      {showSuspendModal && userDetail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>

          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ animation: "modalFadeIn 0.2s ease-out" }}
            onClick={() => setShowSuspendModal(false)}
          />

          {/* Modal Card */}
          <div
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transition-colors duration-300 w-full max-w-md p-7 z-10"
            style={{ animation: "modalFadeIn 0.25s ease-out" }}
          >
            {/* Icon */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
                user.isSuspended ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
              }`}
            >
              {user.isSuspended ? (
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              {user.isSuspended ? "Confirm Unsuspend" : "Confirm Suspension"}
            </h2>

            {/* Body */}
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm leading-relaxed mb-7">
              {user.isSuspended ? (
                <>
                  Are you sure you want to unsuspend{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">{user.displayName}</span>?
                  <br />
                  The user will regain access to their account.
                </>
              ) : (
                <>
                  Are you sure you want to suspend{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">{user.displayName}</span>?
                  <br />
                  This user will not be able to place bets or access their account.
                </>
              )}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuspendModal(false)}
                disabled={suspending}
                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleSuspendToggle();
                  setShowSuspendModal(false);
                }}
                disabled={suspending}
                className={`flex-1 px-5 py-2.5 rounded-xl font-medium text-sm text-white transition-colors disabled:opacity-50 ${
                  user.isSuspended
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {suspending
                  ? "Updating..."
                  : user.isSuspended
                  ? "Confirm Unsuspend"
                  : "Confirm Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
