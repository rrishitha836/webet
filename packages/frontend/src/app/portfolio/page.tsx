'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio, useTradeHistory, type Position, type TradeHistoryItem } from '@/hooks/useTrading';
import { useRouter } from 'next/navigation';

const PNL_COLORS = {
  positive: 'text-emerald-600',
  negative: 'text-rose-600',
  zero: 'text-gray-500 dark:text-gray-400',
};

function pnlColor(val: number) {
  if (val > 0.01) return PNL_COLORS.positive;
  if (val < -0.01) return PNL_COLORS.negative;
  return PNL_COLORS.zero;
}

function formatPnl(val: number) {
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}`;
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'positions' | 'history'>('positions');

  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(!!user);
  const { data: historyData, isLoading: historyLoading } = useTradeHistory(100);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view your portfolio</h2>
          <p className="text-gray-500 dark:text-gray-400">Track your positions, P&L, and trade history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Your positions and trade history</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Cards */}
        {portfolio && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Active Positions
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {portfolio.summary.totalPositions}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Total Invested
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {portfolio.summary.totalInvested.toFixed(0)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Current Value
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {portfolio.summary.totalCurrentValue.toFixed(0)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Unrealized P&L
              </div>
              <div className={`text-3xl font-bold ${pnlColor(portfolio.summary.totalUnrealizedPnl)}`}>
                {formatPnl(portfolio.summary.totalUnrealizedPnl)}
              </div>
              <div className={`text-sm font-medium ${pnlColor(portfolio.summary.totalPnlPercent)}`}>
                {formatPnl(portfolio.summary.totalPnlPercent)}%
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setTab('positions')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === 'positions'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Positions
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === 'history'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Trade History
          </button>
        </div>

        {/* Positions Tab */}
        {tab === 'positions' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {portfolioLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : !portfolio || portfolio.positions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-300 dark:text-gray-600 mb-4">
                  <svg className="mx-auto h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No positions yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                  Buy shares in markets to build your portfolio and start earning.
                </p>
                <a href="/" className="inline-flex px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm">
                  Browse Markets
                </a>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="col-span-4">Market</div>
                  <div className="col-span-2">Outcome</div>
                  <div className="col-span-2 text-right">Shares</div>
                  <div className="col-span-2 text-right">Value</div>
                  <div className="col-span-2 text-right">P&L</div>
                </div>
                {portfolio.positions.map((pos: Position, idx: number) => (
                  <button
                    key={`${pos.betId}-${pos.outcomeIndex}`}
                    onClick={() => router.push(`/bets/${pos.betId}`)}
                    className="grid grid-cols-12 gap-2 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left"
                  >
                    <div className="col-span-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {pos.betTitle}
                      </div>
                      <div className={`text-xs mt-0.5 ${
                        pos.betStatus === 'OPEN' ? 'text-emerald-600' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {pos.betStatus}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{pos.outcomeLabel}</span>
                    </div>
                    <div className="col-span-2 text-right self-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{pos.shares.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        avg {(pos.avgCost * 100).toFixed(1)}&cent;
                      </div>
                    </div>
                    <div className="col-span-2 text-right self-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {pos.currentValue.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {(pos.currentPrice * 100).toFixed(1)}&cent;/sh
                      </div>
                    </div>
                    <div className="col-span-2 text-right self-center">
                      <div className={`text-sm font-bold ${pnlColor(pos.unrealizedPnl)}`}>
                        {formatPnl(pos.unrealizedPnl)}
                      </div>
                      <div className={`text-xs font-medium ${pnlColor(pos.pnlPercent)}`}>
                        {formatPnl(pos.pnlPercent)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {historyLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : !historyData || historyData.data.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-300 dark:text-gray-600 mb-4">
                  <svg className="mx-auto h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No trades yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                  Your complete trade history will appear here once you start trading.
                </p>
                <a href="/" className="inline-flex px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm">
                  Find Markets
                </a>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="col-span-3">Market</div>
                  <div className="col-span-2">Outcome</div>
                  <div className="col-span-1 text-center">Side</div>
                  <div className="col-span-2 text-right">Shares</div>
                  <div className="col-span-2 text-right">Cost</div>
                  <div className="col-span-2 text-right">Date</div>
                </div>
                {historyData.data.map((trade: TradeHistoryItem) => (
                  <button
                    key={trade.id}
                    onClick={() => router.push(`/bets/${trade.betId}`)}
                    className="grid grid-cols-12 gap-2 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left"
                  >
                    <div className="col-span-3">
                      <div className="text-sm text-gray-900 dark:text-white line-clamp-1">{trade.betTitle}</div>
                    </div>
                    <div className="col-span-2 self-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{trade.outcomeLabel}</span>
                    </div>
                    <div className="col-span-1 text-center self-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                        trade.side === 'BUY'
                          ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
                      }`}>
                        {trade.side}
                      </span>
                    </div>
                    <div className="col-span-2 text-right self-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{trade.shares.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        @ {(trade.avgPrice * 100).toFixed(1)}&cent;
                      </div>
                    </div>
                    <div className="col-span-2 text-right self-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {trade.cost.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-2 text-right self-center text-xs text-gray-500 dark:text-gray-400">
                      {new Date(trade.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
