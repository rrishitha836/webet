"use client";

import { useRouter } from "next/navigation";

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

/* ── Refined colour palette ────────────────────────────── */
const OUTCOME_STYLES = [
  {
    bg: "bg-emerald-50/80 dark:bg-emerald-900/20",
    border: "border-emerald-200/60 dark:border-emerald-700/40",
    text: "text-emerald-700 dark:text-emerald-300",
    hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
    hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-500",
    bar: "bg-emerald-400 dark:bg-emerald-500",
  },
  {
    bg: "bg-rose-50/80 dark:bg-rose-900/20",
    border: "border-rose-200/60 dark:border-rose-700/40",
    text: "text-rose-700 dark:text-rose-300",
    hoverBg: "hover:bg-rose-100 dark:hover:bg-rose-900/40",
    hoverBorder: "hover:border-rose-400 dark:hover:border-rose-500",
    bar: "bg-rose-400 dark:bg-rose-500",
  },
  {
    bg: "bg-blue-50/80 dark:bg-blue-900/20",
    border: "border-blue-200/60 dark:border-blue-700/40",
    text: "text-blue-700 dark:text-blue-300",
    hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-900/40",
    hoverBorder: "hover:border-blue-400 dark:hover:border-blue-500",
    bar: "bg-blue-400 dark:bg-blue-500",
  },
  {
    bg: "bg-amber-50/80 dark:bg-amber-900/20",
    border: "border-amber-200/60 dark:border-amber-700/40",
    text: "text-amber-700 dark:text-amber-300",
    hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/40",
    hoverBorder: "hover:border-amber-400 dark:hover:border-amber-500",
    bar: "bg-amber-400 dark:bg-amber-500",
  },
  {
    bg: "bg-purple-50/80 dark:bg-purple-900/20",
    border: "border-purple-200/60 dark:border-purple-700/40",
    text: "text-purple-700 dark:text-purple-300",
    hoverBg: "hover:bg-purple-100 dark:hover:bg-purple-900/40",
    hoverBorder: "hover:border-purple-400 dark:hover:border-purple-500",
    bar: "bg-purple-400 dark:bg-purple-500",
  },
  {
    bg: "bg-cyan-50/80 dark:bg-cyan-900/20",
    border: "border-cyan-200/60 dark:border-cyan-700/40",
    text: "text-cyan-700 dark:text-cyan-300",
    hoverBg: "hover:bg-cyan-100 dark:hover:bg-cyan-900/40",
    hoverBorder: "hover:border-cyan-400 dark:hover:border-cyan-500",
    bar: "bg-cyan-400 dark:bg-cyan-500",
  },
];

export function BetCard({ bet }: BetCardProps) {
  const router = useRouter();

  const navigateToBet = () => {
    router.push(`/bets/${bet.id}`);
  };

  const numOutcomes = bet.outcomes?.length || 0;
  const gridCols =
    numOutcomes <= 2
      ? "grid-cols-2"
      : numOutcomes <= 3
        ? "grid-cols-3"
        : "grid-cols-2 sm:grid-cols-3";

  const volume = bet.totalVolume || bet.totalPool || 0;
  const closesDate = new Date(bet.endTime);

  return (
    <div
      onClick={navigateToBet}
      className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-300 ease-out cursor-pointer group flex flex-col"
    >
      {/* Title */}
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {bet.question}
        </h3>
      </div>

      {/* Outcome Buttons */}
      {bet.outcomes && bet.outcomes.length > 0 && (
        <div className="px-5 pb-4 flex-1">
          <div className={`grid ${gridCols} gap-2`}>
            {bet.outcomes.map((outcome, idx) => {
              const s = OUTCOME_STYLES[idx % OUTCOME_STYLES.length];
              const defaultPrice = 1 / bet.outcomes.length;
              const price = outcome.currentPrice ?? defaultPrice;
              const pct = Math.round(price * 100);
              return (
                <button
                  key={outcome.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToBet();
                  }}
                  className={`relative py-3.5 px-3 rounded-xl border transition-all duration-200 text-center active:scale-[0.97] min-w-0 ${s.bg} ${s.border} ${s.text} ${s.hoverBg} ${s.hoverBorder}`}
                >
                  <div className="text-[11px] font-medium truncate mb-1 opacity-80">
                    {outcome.text}
                  </div>
                  <div className="text-xl font-bold leading-tight tracking-tight">
                    {pct}{"\u00a2"}
                  </div>
                  {/* Thin probability bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-xl bg-gray-200/50 dark:bg-gray-700/30 overflow-hidden">
                    <div
                      className={`h-full rounded-b-xl transition-all duration-500 ${s.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer: Volume + Closes */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 dark:border-gray-700/40 mt-auto">
        <div className="flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
          <span className="text-xs text-gray-400 dark:text-gray-500">Vol</span>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            ${volume.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs text-gray-400 dark:text-gray-500">Closes</span>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {closesDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
