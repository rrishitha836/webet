'use client';

import { useMemo } from 'react';
import { usePriceChart } from '@/hooks/useTrading';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface PriceChartProps {
  betId: string;
  outcomeLabels: string[];
}

const CHART_COLORS = [
  '#10b981', // emerald-500
  '#f43f5e', // rose-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#8b5cf6', // purple-500
  '#06b6d4', // cyan-500
];

export function PriceChart({ betId, outcomeLabels }: PriceChartProps) {
  const { data: chartData, isLoading } = usePriceChart(betId);

  const formatted = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    return chartData.map((point) => {
      const row: Record<string, any> = {
        time: new Date(point.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        fullTime: new Date(point.timestamp).toLocaleString(),
      };
      point.prices.forEach((p: number, i: number) => {
        row[`outcome_${i}`] = Math.round(p * 10000) / 100; // convert to percentage
      });
      return row;
    });
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 transition-colors duration-300">
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-pulse text-sm text-gray-400 dark:text-gray-500">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (formatted.length < 2) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 transition-colors duration-300">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Price History
        </h3>
        <div className="h-[160px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          Not enough trading data yet. Prices will appear after trades.
        </div>
      </div>
    );
  }

  const numOutcomes = chartData?.[0]?.prices?.length || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 transition-colors duration-300">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        Price History
      </h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: '0 10px 25px rgba(0,0,0,.25)',
              }}
              labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
              itemStyle={{ fontSize: 12, padding: '2px 0' }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTime || ''}
              formatter={(value: number, name: string) => {
                const idx = parseInt(name.replace('outcome_', ''), 10);
                return [`${value.toFixed(1)}%`, outcomeLabels[idx] || `Outcome ${idx + 1}`];
              }}
            />
            {numOutcomes <= 4 && (
              <Legend
                verticalAlign="top"
                height={28}
                formatter={(value: string) => {
                  const idx = parseInt(value.replace('outcome_', ''), 10);
                  return outcomeLabels[idx] || `Outcome ${idx + 1}`;
                }}
                wrapperStyle={{ fontSize: 12 }}
              />
            )}
            {Array.from({ length: numOutcomes }).map((_, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={`outcome_${i}`}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
