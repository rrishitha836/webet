'use client';

import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import UserLayout from '@/components/layout/UserLayout';

const MEDAL_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

function MedalIcon({ rank }: { rank: number }) {
  if (rank > 3) return null;
  return (
    <svg className={`w-6 h-6 ${MEDAL_COLORS[rank - 1]}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function LeaderboardPage() {
  const { data: leaders, isLoading } = useLeaderboard(50);
  const { user } = useAuth();
  const router = useRouter();

  const myRank = leaders?.find((l) => l.id === user?.id);

  return (
    <UserLayout>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">Top traders ranked by net worth</p>
            </div>
          </div>
        </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Your Rank Card */}
        {myRank && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-200">Your Rank</div>
                <div className="text-4xl font-bold">#{myRank.rank}</div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">{myRank.netWorth.toFixed(0)}</div>
                  <div className="text-xs text-blue-200">Net Worth</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{myRank.totalWins}</div>
                  <div className="text-xs text-blue-200">Wins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{myRank.winRate}%</div>
                  <div className="text-xs text-blue-200">Win Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {leaders && leaders.length >= 3 && (
          <div className="grid grid-cols-3 gap-4">
            {[1, 0, 2].map((podiumIdx) => {
              const leader = leaders[podiumIdx];
              if (!leader) return null;
              const isFirst = podiumIdx === 0;
              return (
                <div
                  key={leader.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-center ${
                    isFirst ? 'ring-2 ring-yellow-400 shadow-lg -mt-2' : ''
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <MedalIcon rank={leader.rank} />
                  </div>
                  {leader.avatarUrl ? (
                    <img
                      src={leader.avatarUrl}
                      alt={leader.displayName}
                      className={`mx-auto rounded-full border-2 ${
                        isFirst ? 'w-16 h-16 border-yellow-400' : 'w-12 h-12 border-gray-200 dark:border-gray-700'
                      }`}
                    />
                  ) : (
                    <div
                      className={`mx-auto rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold ${
                        isFirst ? 'w-16 h-16 text-xl' : 'w-12 h-12 text-lg'
                      }`}
                    >
                      {leader.displayName?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="mt-2 font-semibold text-gray-900 dark:text-white truncate text-sm">
                    {leader.displayName}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {leader.netWorth.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">net worth</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : !leaders || leaders.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No traders yet. Be the first!
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 px-4 sm:px-5 py-3 bg-gray-50 dark:bg-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Trader</div>
                <div className="hidden sm:block col-span-2 text-right">Balance</div>
                <div className="hidden sm:block col-span-2 text-right">Portfolio</div>
                <div className="col-span-2 text-right">Net Worth</div>
                <div className="hidden sm:block col-span-1 text-right">W/R</div>
                <div className="hidden sm:block col-span-1 text-right">Trades</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {leaders.map((leader) => {
                  const isMe = leader.id === user?.id;
                  return (
                    <div
                      key={leader.id}
                      className={`grid grid-cols-6 sm:grid-cols-12 gap-2 px-4 sm:px-5 py-3.5 items-center transition-colors ${
                        isMe
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1 flex items-center">
                        {leader.rank <= 3 ? (
                          <MedalIcon rank={leader.rank} />
                        ) : (
                          <span className="text-sm font-bold text-gray-400">{leader.rank}</span>
                        )}
                      </div>

                      {/* User */}
                      <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                        {leader.avatarUrl ? (
                          <img
                            src={leader.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xs flex-shrink-0">
                            {leader.displayName?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {leader.displayName}
                            {isMe && (
                              <span className="ml-1.5 text-xs font-medium text-blue-600">(you)</span>
                            )}
                          </div>
                          {leader.activePositions > 0 && (
                            <div className="text-xs text-gray-400">
                              {leader.activePositions} active position{leader.activePositions !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="hidden sm:block col-span-2 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {leader.balance.toLocaleString()}
                        </span>
                      </div>

                      {/* Portfolio */}
                      <div className="hidden sm:block col-span-2 text-right">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {leader.portfolioValue > 0 ? leader.portfolioValue.toFixed(0) : '—'}
                        </span>
                      </div>

                      {/* Net Worth */}
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {leader.netWorth.toFixed(0)}
                        </span>
                      </div>

                      {/* Win Rate */}
                      <div className="hidden sm:block col-span-1 text-right">
                        <span className={`text-sm font-medium ${
                          leader.winRate >= 60 ? 'text-emerald-600' :
                          leader.winRate >= 40 ? 'text-gray-700 dark:text-gray-300' : 'text-rose-600'
                        }`}>
                          {leader.winRate}%
                        </span>
                      </div>

                      {/* Trades */}
                      <div className="hidden sm:block col-span-1 text-right">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{leader.totalBets}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </UserLayout>
  );
}
