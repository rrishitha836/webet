'use client';

import { useActivityFeed, type ActivityItem } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed() {
  const { data, isLoading } = useActivityFeed(20);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 transition-colors duration-300">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Recent Activity
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activities = data?.data || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Recent Activity
        </h3>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
          No recent activity yet. Start trading!
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {activities.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(`/bets/${item.betId}`)}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left"
            >
              {/* Avatar */}
              {item.userAvatar ? (
                <img
                  src={item.userAvatar}
                  alt=""
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xs flex-shrink-0 mt-0.5">
                  {item.userName?.charAt(0) || '?'}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">{item.userName}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {' '}
                    {item.side === 'BUY' ? 'bought' : 'sold'}{' '}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.shares.toFixed(1)} shares
                  </span>
                  <span className="text-gray-500 dark:text-gray-400"> of </span>
                  <span className={`font-medium ${
                    item.side === 'BUY' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {item.outcomeLabel}
                  </span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                  {item.betTitle}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded ${
                    item.side === 'BUY'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.side}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ${Math.abs(item.cost).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    @ {(item.avgPrice * 100).toFixed(1)}¢
                  </span>
                  <span className="text-xs text-gray-300 dark:text-gray-600 ml-auto">
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
