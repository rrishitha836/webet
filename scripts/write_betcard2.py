#!/usr/bin/env python3
"""Rewrite BetCard with fixed layout (grid-based outcomes) and overflow safety."""
import os

target = os.path.join(
    os.path.dirname(__file__), "..", "packages", "frontend", "src",
    "components", "bets", "BetCard.tsx"
)

content = r""""use client";

import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-blue-200 bg-blue-50 text-blue-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-purple-200 bg-purple-50 text-purple-700",
  "border-cyan-200 bg-cyan-50 text-cyan-700",
];

export function BetCard({ bet }: BetCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    OPEN: "bg-green-100 text-green-800",
    CLOSED: "bg-yellow-100 text-yellow-800",
    RESOLVED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
    PAUSED: "bg-orange-100 text-orange-800",
    DRAFT: "bg-gray-100 text-gray-800",
  };

  const categoryColors: Record<string, string> = {
    SPORTS: "bg-orange-500",
    POLITICS: "bg-blue-500",
    ENTERTAINMENT: "bg-purple-500",
    TECHNOLOGY: "bg-yellow-500",
    CULTURE: "bg-cyan-500",
    OTHER: "bg-gray-500",
  };

  const navigateToBet = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/bets/${bet.id}`);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const shareToSocial = (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/bets/${bet.id}`;
    const text = `Check out this market: ${bet.question}`;
    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        setShowShareMenu(false);
        return;
    }
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      setShowShareMenu(false);
    }
  };

  // Compute grid columns for outcomes based on count
  const numOutcomes = bet.outcomes?.length || 0;
  const gridCols =
    numOutcomes <= 2
      ? "grid-cols-2"
      : numOutcomes <= 3
        ? "grid-cols-3"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug">
              {bet.question}
            </h3>
          </div>

          {/* Share button */}
          {user && (
            <div className="relative flex-shrink-0">
              <button
                onClick={handleShareClick}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
                title="Share"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>

              {showShareMenu && (
                <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-44">
                  <div className="py-1">
                    {(["twitter", "facebook", "whatsapp", "telegram"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={(e) => shareToSocial(p, e)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 capitalize"
                      >
                        {p}
                      </button>
                    ))}
                    <hr className="my-1" />
                    <button
                      onClick={(e) => shareToSocial("copy", e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {bet.description && (
          <div className="mb-3">
            <p className={`text-sm text-gray-500 leading-relaxed ${descriptionExpanded ? "" : "line-clamp-2"}`}>
              {bet.description}
            </p>
            {bet.description.length > 100 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDescriptionExpanded(!descriptionExpanded);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
              >
                {descriptionExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              statusColors[bet.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {bet.status}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${
              categoryColors[bet.category] || categoryColors.OTHER
            }`}
          >
            {bet.category}
          </span>
        </div>

        {/* Countdown Timer */}
        {bet.status === "OPEN" && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Closes in:</p>
            <CountdownTimer targetDate={bet.endTime} />
          </div>
        )}

        {/* Outcomes — responsive grid */}
        {bet.outcomes && bet.outcomes.length > 0 && (
          <div className="mb-4">
            <div className={`grid ${gridCols} gap-2`}>
              {bet.outcomes.map((outcome, idx) => {
                const defaultPrice = 1 / bet.outcomes.length;
                const price = outcome.currentPrice ?? defaultPrice;
                const pct = (price * 100).toFixed(0);
                return (
                  <button
                    key={outcome.id}
                    onClick={navigateToBet}
                    className={`p-2.5 rounded-xl border-2 transition-all text-center hover:shadow-sm min-w-0 ${
                      OUTCOME_COLORS[idx % OUTCOME_COLORS.length]
                    }`}
                  >
                    <div className="text-[11px] font-medium truncate mb-0.5">{outcome.text}</div>
                    <div className="text-lg font-bold leading-tight">{pct}{"\u00a2"}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">Vol </span>
            <span className="font-semibold text-gray-900">
              {(bet.totalVolume || bet.totalPool || 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Traders </span>
            <span className="font-semibold text-gray-900">{bet._count?.participants || 0}</span>
          </div>
        </div>

        <button
          onClick={navigateToBet}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            bet.status === "OPEN"
              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {bet.status === "OPEN" ? "Trade" : "View"}
        </button>
      </div>

      {/* Click outside to close share menu */}
      {showShareMenu && <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />}
    </div>
  );
}
"""

with open(target, "w") as f:
    f.write(content)

print(f"Written {len(content)} bytes to {os.path.basename(target)}")
