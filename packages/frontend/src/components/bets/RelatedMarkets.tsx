'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface RelatedMarket {
  id: string;
  title: string;
  category: string;
  participantCount: number;
  totalVolume: number;
  outcomes: { id: string; label: string; currentPrice: number | null }[];
}

function useRelatedMarkets(betId: string) {
  return useQuery<RelatedMarket[]>({
    queryKey: ['related-markets', betId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/bets/${betId}/related`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    },
    staleTime: 60000,
  });
}

export function RelatedMarkets({ betId }: { betId: string }) {
  const { data: markets, isLoading } = useRelatedMarkets(betId);

  if (isLoading) return null;
  if (!markets || markets.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Related Markets
        </h3>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {markets.map((market) => {
          const topOutcome = market.outcomes?.[0];
          const price = topOutcome?.currentPrice;
          return (
            <Link
              key={market.id}
              href={`/bets/${market.id}`}
              className="block px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                {market.title}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{market.participantCount} traders</span>
                  <span>{market.totalVolume.toFixed(0)} vol</span>
                </div>
                {topOutcome && price != null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{topOutcome.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      price > 0.5
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {(price * 100).toFixed(0)}¢
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
