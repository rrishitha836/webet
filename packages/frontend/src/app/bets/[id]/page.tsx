'use client';

import { useState, useEffect } from 'react';
import { useBet } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { PositionCard } from '@/components/trading/PositionCard';
import { PriceChart } from '@/components/trading/PriceChart';
import { CommentsSection } from '@/components/social/CommentsSection';
import { RelatedMarkets } from '@/components/bets/RelatedMarkets';
import { useRouter } from 'next/navigation';
import UserLayout from '@/components/layout/UserLayout';

export default function BetDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: bet, isLoading } = useBet(id);
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Subscribe to bet-specific WebSocket room for real-time updates
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('subscribe:bet', id);
    return () => {
      socket.emit('unsubscribe:bet', id);
    };
  }, [socket, id]);

  const shareToSocial = (platform: string) => {
    const url = `${window.location.origin}/bets/${bet?.id}`;
    const text = `Check out this market: ${bet?.question}`;
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setShowShareMenu(false);
        return;
    }
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Market not found</h2>
        <Button onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  const statusConfig: Record<string, { bg: string; dot: string }> = {
    OPEN: { bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
    ACTIVE: { bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
    PENDING: { bg: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
    CLOSED: { bg: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600', dot: 'bg-gray-400' },
    RESOLVED: { bg: 'bg-blue-50 text-blue-700 border border-blue-200', dot: 'bg-blue-500' },
    CANCELLED: { bg: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500' },
  };

  const sc = statusConfig[bet.status] || statusConfig.CLOSED;

  return (
    <UserLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {bet.status}
                </span>
                {bet.category && (
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                    {bet.category}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                {bet.question}
              </h1>
              {bet.description && (
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-base leading-relaxed">{bet.description}</p>
              )}
            </div>

            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 w-48 py-1">
                  {['twitter', 'facebook', 'whatsapp', 'telegram'].map((p) => (
                    <button
                      key={p}
                      onClick={() => shareToSocial(p)}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 capitalize"
                    >
                      {p}
                    </button>
                  ))}
                  <hr className="my-1" />
                  <button
                    onClick={() => shareToSocial('copy')}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left Column (3/5): Market Data */}
          <div className="lg:col-span-3 space-y-6">
            {bet.status === 'OPEN' && (
              <Card>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Time Remaining
                </h3>
                <CountdownTimer targetDate={bet.endTime} />
              </Card>
            )}

            <Card>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Outcome Details
              </h3>
              <div className="space-y-3">
                {bet.outcomes.map((outcome: any, idx: number) => {
                  const defaultPrice = 1 / bet.outcomes.length;
                  const price = outcome.currentPrice ?? defaultPrice;
                  const pct = (price * 100).toFixed(1);
                  return (
                    <div
                      key={outcome.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          ['bg-emerald-500', 'bg-rose-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500'][idx % 5]
                        }`} />
                        <span className="font-medium text-gray-900 dark:text-white">{outcome.text}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{pct}¢</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({(price * 100).toFixed(0)}% chance)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Price History Chart */}
            <PriceChart
              betId={id}
              outcomeLabels={bet.outcomes.map((o: any) => o.text)}
            />

            <Card>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Market Info
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(bet.totalVolume || 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Volume</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {bet._count?.participants || bet.participantCount || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Traders</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {bet.outcomes?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Outcomes</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {bet.liquidityB ? `${bet.liquidityB.toFixed(0)}` : '\u2014'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Liquidity</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Ends {new Date(bet.endTime).toLocaleString()}
              </div>
            </Card>

            {/* Comments / Discussion */}
            <CommentsSection betId={id} />

            {/* Related Markets */}
            <RelatedMarkets betId={id} />
          </div>

          {/* Right Column (2/5): Trading */}
          <div className="lg:col-span-2 space-y-6">
            <TradingPanel
              betId={id}
              outcomes={bet.outcomes}
              status={bet.status}
            />

            {user && (
              <PositionCard
                betId={id}
                outcomes={bet.outcomes}
              />
            )}

            {bet.status === 'OPEN' && user && (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
                <div className="text-sm font-medium text-blue-100 mb-1">Your Balance</div>
                <div className="text-3xl font-bold">${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showShareMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowShareMenu(false)} />
      )}
    </div>
    </UserLayout>
  );
}
