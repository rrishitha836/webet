#!/usr/bin/env python3
"""Rewrite TradingPanel with fixed pricing, error guards, and UX improvements."""
import os

target = os.path.join(
    os.path.dirname(__file__), "..", "packages", "frontend", "src",
    "components", "trading", "TradingPanel.tsx"
)

content = r""""use client";

import { useState, useMemo, useCallback } from "react";
import {
  useMarketPrices,
  useBuyShares,
  useSellShares,
  useTradeQuote,
} from "@/hooks/useTrading";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

interface TradingPanelProps {
  betId: string;
  outcomes: { id: string; text: string; sortOrder?: number }[];
  status: string;
}

const OUTCOME_COLORS = [
  {
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    border: "border-emerald-500",
    text: "text-emerald-600",
    ring: "ring-emerald-500/30",
  },
  {
    bg: "bg-rose-500",
    bgLight: "bg-rose-50",
    border: "border-rose-500",
    text: "text-rose-600",
    ring: "ring-rose-500/30",
  },
  {
    bg: "bg-blue-500",
    bgLight: "bg-blue-50",
    border: "border-blue-500",
    text: "text-blue-600",
    ring: "ring-blue-500/30",
  },
  {
    bg: "bg-amber-500",
    bgLight: "bg-amber-50",
    border: "border-amber-500",
    text: "text-amber-600",
    ring: "ring-amber-500/30",
  },
  {
    bg: "bg-purple-500",
    bgLight: "bg-purple-50",
    border: "border-purple-500",
    text: "text-purple-600",
    ring: "ring-purple-500/30",
  },
  {
    bg: "bg-cyan-500",
    bgLight: "bg-cyan-50",
    border: "border-cyan-500",
    text: "text-cyan-600",
    ring: "ring-cyan-500/30",
  },
];

export function TradingPanel({ betId, outcomes, status }: TradingPanelProps) {
  const { user } = useAuth();
  const { data: market, isLoading: pricesLoading } = useMarketPrices(
    betId,
    status === "OPEN",
  );

  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [shares, setShares] = useState<number>(10);
  const [inputValue, setInputValue] = useState("10");

  const buyMutation = useBuyShares();
  const sellMutation = useSellShares();

  const hasSelection = selectedOutcome !== null;

  // Get quote for current selection
  const { data: quote, isLoading: quoteLoading } = useTradeQuote(
    betId,
    side,
    selectedOutcome ?? 0,
    shares,
    status === "OPEN" && shares > 0 && hasSelection,
  );

  // Get user's position for the selected outcome
  const userPosition = useMemo(() => {
    if (!hasSelection) return undefined;
    return market?.userPositions?.find(
      (p) => p.outcomeIndex === selectedOutcome,
    );
  }, [market, selectedOutcome, hasSelection]);

  const maxSellableShares = useMemo(() => {
    return userPosition?.shares || 0;
  }, [userPosition]);

  const handleSharesChange = useCallback((val: string) => {
    setInputValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setShares(num);
    }
  }, []);

  const handlePresetShares = useCallback((val: number) => {
    setShares(val);
    setInputValue(val.toString());
  }, []);

  const handleTrade = async () => {
    if (!user) {
      toast.error("Please sign in to trade");
      return;
    }
    if (!hasSelection) {
      toast.error("Please select an outcome first");
      return;
    }
    if (shares <= 0) {
      toast.error("Enter the number of shares");
      return;
    }
    if (side === "SELL" && shares > maxSellableShares) {
      toast.error(
        `You only hold ${maxSellableShares.toFixed(1)} shares to sell`,
      );
      return;
    }

    try {
      if (side === "BUY") {
        const result = await buyMutation.mutateAsync({
          betId,
          outcomeIndex: selectedOutcome!,
          shares,
        });
        toast.success(
          `Bought ${shares} shares of "${outcomes[selectedOutcome!]?.text}" at ${(result.avgPrice * 100).toFixed(1)}\u00a2`,
        );
      } else {
        const result = await sellMutation.mutateAsync({
          betId,
          outcomeIndex: selectedOutcome!,
          shares,
        });
        toast.success(
          `Sold ${shares} shares of "${outcomes[selectedOutcome!]?.text}" for ${result.proceeds?.toFixed(2)} coins`,
        );
      }
      // Reset shares after trade
      setShares(10);
      setInputValue("10");
    } catch (error: any) {
      toast.error(error.message || "Trade failed. Please try again.");
    }
  };

  const isPending = buyMutation.isPending || sellMutation.isPending;
  const prices = market?.prices || [];
  const isMarketOpen = status === "OPEN";
  const defaultPrice = 1 / (outcomes.length || 1);

  // Compute grid cols for the outcome buttons
  const gridCols =
    outcomes.length <= 2
      ? "grid-cols-2"
      : outcomes.length <= 3
        ? "grid-cols-3"
        : "grid-cols-2";

  if (pricesLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 overflow-hidden">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-16 bg-gray-200 rounded-xl" />
            <div className="h-16 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-12 bg-gray-200 rounded-xl" />
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Trade
        </h3>
        {market && (
          <span className="text-xs text-gray-400">
            Vol: {market.totalVolume.toFixed(0)} coins
          </span>
        )}
      </div>

      {/* ── Outcome Price Buttons ── */}
      <div className="px-4 pb-2">
        <p className="text-xs text-gray-400 mb-2">Select an outcome to trade:</p>
        <div className={`grid ${gridCols} gap-2`}>
          {outcomes.map((outcome, idx) => {
            const colors = OUTCOME_COLORS[idx % OUTCOME_COLORS.length];
            const price = prices[idx] ?? defaultPrice;
            const pct = (price * 100).toFixed(1);
            const isSelected = selectedOutcome === idx;

            return (
              <button
                key={outcome.id}
                onClick={() => setSelectedOutcome(idx)}
                className={`relative p-3 rounded-xl border-2 transition-all duration-200 min-w-0 ${
                  isSelected
                    ? `${colors.border} ${colors.bgLight} ring-4 ${colors.ring} scale-[1.02]`
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5">
                    <svg className={`w-4 h-4 ${colors.text}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="text-[11px] font-medium text-gray-600 truncate mb-0.5">
                  {outcome.text}
                </div>
                <div
                  className={`text-xl font-bold ${isSelected ? colors.text : "text-gray-900"}`}
                >
                  {pct}{"\u00a2"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Price Distribution Bar ── */}
      {prices.length > 0 && (
        <div className="px-4 pt-1 pb-2">
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
            {prices.map((p, idx) => {
              const colors = OUTCOME_COLORS[idx % OUTCOME_COLORS.length];
              return (
                <div
                  key={idx}
                  className={`${colors.bg} transition-all duration-500`}
                  style={{ width: `${(p * 100).toFixed(1)}%` }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Buy / Sell Section ── */}
      {isMarketOpen && (
        <div className="p-4 pt-2 space-y-3 border-t border-gray-100">
          {/* Buy / Sell Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setSide("BUY")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                side === "BUY"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide("SELL")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                side === "SELL"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sell
            </button>
          </div>

          {/* Shares Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Shares
              </label>
              {side === "SELL" && maxSellableShares > 0 && (
                <button
                  onClick={() => handlePresetShares(maxSellableShares)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Max: {maxSellableShares.toFixed(1)}
                </button>
              )}
            </div>
            <input
              type="number"
              min="0.1"
              step="1"
              value={inputValue}
              onChange={(e) => handleSharesChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="e.g. 10"
            />
            <div className="flex gap-1.5 mt-2">
              {[1, 5, 10, 25, 50, 100].map((val) => (
                <button
                  key={val}
                  onClick={() => handlePresetShares(val)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    shares === val
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Quote Details */}
          {hasSelection && shares > 0 && (
            <div className="bg-gray-50 rounded-xl p-3.5 space-y-1.5">
              {quoteLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                  <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                </div>
              ) : quote ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {side === "BUY" ? "Total Cost" : "Proceeds"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {Math.abs(quote.cost).toFixed(2)} coins
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg Price</span>
                    <span className="font-medium text-gray-700">
                      {(quote.avgPrice * 100).toFixed(1)}{"\u00a2"} / share
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price After</span>
                    <span className="font-medium text-gray-700">
                      {(quote.priceAfter * 100).toFixed(1)}{"\u00a2"}
                    </span>
                  </div>
                  {side === "BUY" && quote.cost > 0 && (
                    <>
                      <div className="border-t border-gray-200 my-1" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Max Payout</span>
                        <span className="font-semibold text-emerald-600">
                          {quote.maxPayout.toFixed(2)} coins
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Potential Profit</span>
                        <span className="font-semibold text-emerald-600">
                          +{quote.potentialProfit.toFixed(2)} coins (
                          {quote.cost > 0
                            ? ((quote.potentialProfit / quote.cost) * 100).toFixed(0)
                            : 0}
                          %)
                        </span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-400 text-center py-2">
                  Unable to get quote
                </div>
              )}
            </div>
          )}

          {/* Not-selected hint */}
          {!hasSelection && (
            <div className="text-center py-3 text-sm text-gray-400 bg-gray-50 rounded-xl">
              <svg className="w-5 h-5 mx-auto mb-1 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Select an outcome above to start trading
            </div>
          )}

          {/* User Position */}
          {hasSelection && userPosition && userPosition.shares > 0.001 && (
            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">
                Your Position · {outcomes[selectedOutcome!]?.text}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-bold text-blue-900">
                    {userPosition.shares.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-blue-600">Shares</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-900">
                    {(userPosition.avgCost * 100).toFixed(1)}{"\u00a2"}
                  </div>
                  <div className="text-[10px] text-blue-600">Avg Cost</div>
                </div>
                <div>
                  <div
                    className={`text-sm font-bold ${
                      userPosition.unrealizedPnl >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {userPosition.unrealizedPnl >= 0 ? "+" : ""}
                    {userPosition.unrealizedPnl.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-blue-600">P&L</div>
                </div>
              </div>
            </div>
          )}

          {/* Trade Button */}
          {user ? (
            <button
              onClick={handleTrade}
              disabled={
                isPending ||
                !hasSelection ||
                shares <= 0 ||
                (side === "SELL" && shares > maxSellableShares)
              }
              className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                side === "BUY"
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 shadow-lg"
                  : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 shadow-lg"
              }`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : !hasSelection ? (
                "Select an outcome"
              ) : shares <= 0 ? (
                "Enter shares"
              ) : side === "SELL" && shares > maxSellableShares ? (
                "Insufficient shares"
              ) : (
                `${side === "BUY" ? "Buy" : "Sell"} ${shares} share${shares !== 1 ? "s" : ""} ${
                  quote ? `\u2014 ${Math.abs(quote.cost).toFixed(2)} coins` : ""
                }`
              )}
            </button>
          ) : (
            <div className="text-center py-3.5 text-sm text-gray-500 bg-gray-50 rounded-xl">
              Sign in to start trading
            </div>
          )}

          {/* Balance */}
          {user && (
            <div className="text-center text-xs text-gray-400">
              Balance: {user.balance?.toLocaleString() || 0} coins
            </div>
          )}

          {side === "SELL" &&
            hasSelection &&
            maxSellableShares === 0 && (
              <div className="text-center py-2 text-sm text-gray-400">
                You don&apos;t hold shares of this outcome to sell
              </div>
            )}
        </div>
      )}

      {/* Closed/Resolved state */}
      {!isMarketOpen && (
        <div className="p-4">
          <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-xl">
            This market is {status.toLowerCase()}
          </div>
        </div>
      )}
    </div>
  );
}
"""

with open(target, "w") as f:
    f.write(content)

print(f"Written {len(content)} bytes to {os.path.basename(target)}")
