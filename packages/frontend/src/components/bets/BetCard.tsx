"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface BetCardProps {
  bet: {
    id: string;
    question: string;
    description?: string;
    category: string;
    endTime: Date | string;
    status: string;
    totalPool: number;
    totalVolume?: number;
    outcomes: {
      id: string;
      text: string;
      totalStake: number;
      currentPrice?: number;
      sharesQty?: number;
    }[];
    _count?: {
      participants: number;
    };
  };
}

const OUTCOME_COLORS = [
  "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400",
  "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-400",
  "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400",
  "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400",
  "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-400",
  "border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-400",
];

const OUTCOME_COLORS_DARK = [
  "dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50",
  "dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50",
  "dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50",
  "dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50",
  "dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50",
  "dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50",
];

export function BetCard({ bet }: BetCardProps) {
  const router = useRouter();

  const navigateToBet = () => {
    router.push(`/bets/${bet.id}`);
  };

  // Compute grid columns for outcomes based on count
  const numOutcomes = bet.outcomes?.length || 0;
  const gridCols =
    numOutcomes <= 2
      ? "grid-cols-2"
      : numOutcomes <= 3
        ? "grid-cols-3"
        : "grid-cols-2 sm:grid-cols-3";

  const volume = bet.totalVolume || bet.totalPool || 0;
  const closesDate = new Date(bet.endTime);
  const isOpen = bet.status === "OPEN";

  return (
    <div
      onClick={navigateToBet}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      {/* Title */}
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {bet.question}
        </h3>
      </div>

      {/* Outcome Buttons */}
      {bet.outcomes && bet.outcomes.length > 0 && (
        <div className="px-5 pb-4">
          <div className={`grid ${gridCols} gap-2.5`}>
            {bet.outcomes.map((outcome, idx) => {
              const defaultPrice = 1 / bet.outcomes.length;
              const price = outcome.currentPrice ?? defaultPrice;
              const pct = (price * 100).toFixed(0);
              return (
                <button
                  key={outcome.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToBet();
                  }}
                  className={`py-3 px-3 rounded-xl border-2 transition-all text-center active:scale-95 min-w-0 ${
                    OUTCOME_COLORS[idx % OUTCOME_COLORS.length]
                  } ${OUTCOME_COLORS_DARK[idx % OUTCOME_COLORS_DARK.length]}`}
                >
                  <div className="text-xs font-semibold truncate mb-0.5">{outcome.text}</div>
                  <div className="text-xl font-extrabold leading-tight">{pct}{"\u00a2"}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer: Volume + Closes */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-1.5 text-sm">
          <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span className="text-gray-500 dark:text-gray-400">Vol</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">
            ${volume.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-500 dark:text-gray-400">Closes</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">
            {closesDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>
    </div>
  );
}
