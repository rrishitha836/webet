'use client';

import { useMarketPrices } from '@/hooks/useTrading';

interface PositionCardProps {
  betId: string;
  outcomes: { id: string; text: string }[];
}

export function PositionCard({ betId, outcomes }: PositionCardProps) {
  const { data: market } = useMarketPrices(betId);

  const positions = market?.userPositions?.filter((p) => p.shares > 0.001) || [];

  if (positions.length === 0) return null;

  const totalValue = positions.reduce((s, p) => s + p.currentValue, 0);
  const totalCost = positions.reduce((s, p) => s + p.totalCost, 0);
  const totalPnl = totalValue - totalCost;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Your Positions
        </h3>
        <div className={`text-sm font-bold ${totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} P&L
        </div>
      </div>

      <div className="space-y-3">
        {positions.map((pos) => {
          const outcomeName = outcomes[pos.outcomeIndex]?.text || `Outcome ${pos.outcomeIndex + 1}`;
          return (
            <div
              key={pos.outcomeIndex}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
            >
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{outcomeName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {pos.shares.toFixed(2)} shares · avg {(pos.avgCost * 100).toFixed(1)}¢
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {pos.currentValue.toFixed(2)}
                </div>
                <div className={`text-xs font-medium ${pos.unrealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Cost: {totalCost.toFixed(2)}</span>
        <span>Value: {totalValue.toFixed(2)}</span>
      </div>
    </div>
  );
}
