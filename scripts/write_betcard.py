#!/usr/bin/env python3
import os

target = os.path.join(os.path.dirname(__file__), "..", "packages", "frontend", "src", "components", "bets", "BetCard.tsx")

content = r"""'use client';

import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { OutcomeDistributionBar } from '@/components/ui/OutcomeDistributionBar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

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

export function BetCard({ bet }: BetCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-800',
    CLOSED: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    PAUSED: 'bg-orange-100 text-orange-800',
    DRAFT: 'bg-gray-100 text-gray-800',
  };

  const categoryColors: Record<string, string> = {
    SPORTS: 'bg-orange-500',
    POLITICS: 'bg-blue-500',
    ENTERTAINMENT: 'bg-purple-500',
    TECHNOLOGY: 'bg-yellow-500',
    CULTURE: 'bg-cyan-500',
    OTHER: 'bg-gray-500',
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const shareToSocial = (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/bets/${bet.id}`;
    const text = `Check out this market: ${bet.question}`;
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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {bet.question}
          </h3>
          {bet.description && (
            <div className="mb-3">
              <p className={`text-sm text-gray-600 ${descriptionExpanded ? '' : 'line-clamp-2'}`}>
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
                  {descriptionExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/bets/${bet.id}`);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            View full details
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Share button */}
        {user && (
          <div className="relative ml-2">
            <button
              onClick={handleShareClick}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Share this bet"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>

            {showShareMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                <div className="py-2">
                  {(['twitter', 'facebook', 'whatsapp', 'telegram'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={(e) => shareToSocial(p, e)}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 capitalize"
                    >
                      {p}
                    </button>
                  ))}
                  <hr className="my-1" />
                  <button
                    onClick={(e) => shareToSocial('copy', e)}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[bet.status] || 'bg-gray-100 text-gray-800'}`}>
          {bet.status}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${categoryColors[bet.category] || categoryColors.OTHER}`}>
          {bet.category}
        </span>
      </div>

      {/* Countdown Timer */}
      {bet.status === 'OPEN' && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Closes in:</p>
          <CountdownTimer targetDate={bet.endTime} />
        </div>
      )}

      {/* Outcome Distribution */}
      {bet.outcomes && bet.outcomes.length > 0 && (
        <div className="mb-4">
          <OutcomeDistributionBar outcomes={bet.outcomes} />
        </div>
      )}

      {/* Outcomes with LMSR prices */}
      {bet.outcomes && bet.outcomes.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2">
            {bet.outcomes.map((outcome, idx) => {
              const price = outcome.currentPrice ?? 0.5;
              const pct = (price * 100).toFixed(0);
              const colors = [
                'border-emerald-200 bg-emerald-50 text-emerald-700',
                'border-rose-200 bg-rose-50 text-rose-700',
                'border-blue-200 bg-blue-50 text-blue-700',
                'border-amber-200 bg-amber-50 text-amber-700',
              ];
              return (
                <button
                  key={outcome.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/bets/${bet.id}`);
                  }}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all text-center hover:shadow-sm ${colors[idx % colors.length]}`}
                >
                  <div className="text-xs font-medium truncate mb-1">{outcome.text}</div>
                  <div className="text-xl font-bold">{pct}{'\u00a2'}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-600">Volume</p>
            <p className="text-lg font-bold text-gray-900">
              {(bet.totalVolume || bet.totalPool || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Traders</p>
            <p className="text-lg font-bold text-gray-900">{bet._count?.participants || 0}</p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/bets/${bet.id}`);
          }}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            bet.status === 'OPEN'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {bet.status === 'OPEN' ? 'Trade' : 'View Details'}
        </button>
      </div>

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}
"""

with open(target, 'w') as f:
    f.write(content)

print(f"Written {len(content)} bytes to {target}")
