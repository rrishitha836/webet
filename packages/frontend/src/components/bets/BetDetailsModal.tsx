'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBet } from '@/hooks/useApi';

interface BetDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  betId: string;
  userWager?: {
    id: string;
    amount: number;
    status: string;
    outcome: {
      id: string;
      label: string;
    };
    createdAt: string;
  };
}

// ── Color helpers ──
function getOutcomeColor(label: string) {
  const normalized = label?.toUpperCase().trim();
  if (normalized === 'YES') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', bar: 'bg-emerald-500', ring: 'ring-emerald-200' };
  if (normalized === 'NO') return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', bar: 'bg-red-500', ring: 'ring-red-200' };
  if (normalized === 'DRAW') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', bar: 'bg-amber-500', ring: 'ring-amber-200' };
  const pastels = [
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-300', bar: 'bg-violet-500', ring: 'ring-violet-200' },
    { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300', bar: 'bg-sky-500', ring: 'ring-sky-200' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-300', bar: 'bg-pink-500', ring: 'ring-pink-200' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300', bar: 'bg-teal-500', ring: 'ring-teal-200' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', bar: 'bg-orange-500', ring: 'ring-orange-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', bar: 'bg-indigo-500', ring: 'ring-indigo-200' },
  ];
  const hash = label?.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 0;
  return pastels[hash % pastels.length];
}

export function BetDetailsModal({ isOpen, onClose, betId, userWager }: BetDetailsModalProps) {
  const router = useRouter();
  const { data: bet, isLoading, error } = useBet(betId);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // ESC key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800 ring-1 ring-green-200';
      case 'CLOSED': return 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200';
      case 'RESOLVED': return 'bg-blue-100 text-blue-800 ring-1 ring-blue-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 ring-1 ring-red-200';
      case 'PAUSED': return 'bg-orange-100 text-orange-800 ring-1 ring-orange-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWagerStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200';
      case 'LOST': return 'bg-red-100 text-red-800 ring-1 ring-red-200';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800 ring-1 ring-blue-200';
      case 'REFUNDED': return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 transition-colors duration-300">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-backdrop"
        onClick={onClose}
      />
      
      {/* ── Mobile: Bottom Sheet ── */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 animate-modal-slide-up">
        <div 
          className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 pt-3 pb-3 flex-shrink-0">
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto mb-3" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Bet Details</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto overscroll-contain flex-1 px-4 py-4">
            <ModalBody
              bet={bet}
              isLoading={isLoading}
              error={error}
              userWager={userWager}
              getStatusColor={getStatusColor}
              getWagerStatusColor={getWagerStatusColor}
              formatDate={formatDate}
              isMobile={true}
              onNavigate={(path: string) => { onClose(); router.push(path); }}
            />
            {/* Bottom safe-area padding */}
            <div className="h-6" />
          </div>
        </div>
      </div>

      {/* ── Desktop: Centered Modal ── */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6 lg:p-8">
        <div 
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-modal-fade-scale"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bet Details</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto overscroll-contain flex-1 px-6 py-5">
            <ModalBody
              bet={bet}
              isLoading={isLoading}
              error={error}
              userWager={userWager}
              getStatusColor={getStatusColor}
              getWagerStatusColor={getWagerStatusColor}
              formatDate={formatDate}
              isMobile={false}
              onNavigate={(path: string) => { onClose(); router.push(path); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Shared modal body – renders content for both
   mobile bottom-sheet and desktop centered modal
   ════════════════════════════════════════════════ */
function ModalBody({
  bet,
  isLoading,
  error,
  userWager,
  getStatusColor,
  getWagerStatusColor,
  formatDate,
  isMobile,
  onNavigate,
}: {
  bet: any;
  isLoading: boolean;
  error: any;
  userWager: any;
  getStatusColor: (s: string) => string;
  getWagerStatusColor: (s: string) => string;
  formatDate: (s: string) => string;
  isMobile: boolean;
  onNavigate: (path: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">Failed to load bet details</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Please try again later.</p>
      </div>
    );
  }

  if (!bet) return null;

  return (
    <div className="space-y-5">
      {/* ── Title & Status ── */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <h2 className={`font-bold text-gray-900 dark:text-white flex-1 leading-snug ${isMobile ? 'text-lg' : 'text-xl'}`}>
            {bet.question}
          </h2>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(bet.status)}`}>
              {bet.status}
            </span>
            {userWager && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getWagerStatusColor(userWager.status)}`}>
                {userWager.status}
              </span>
            )}
          </div>
        </div>
        {bet.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{bet.description}</p>
        )}
      </div>

      {/* ── Info Grid ── */}
      <div className={`grid gap-2.5 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{bet.liquidityB ? 'Trading Volume' : 'Total Pool'}</p>
          <p className={`font-bold text-gray-900 dark:text-white ${isMobile ? 'text-base' : 'text-lg'}`}>
            ${(bet.totalPool || bet.totalVolume || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Participants</p>
          <p className={`font-bold text-gray-900 dark:text-white ${isMobile ? 'text-base' : 'text-lg'}`}>
            {bet._count?.participants || bet.participantCount || 0}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Category</p>
          <p className="text-sm font-semibold text-blue-600">{bet.category || 'N/A'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
            {bet.status === 'OPEN' ? 'Closes' : bet.status === 'RESOLVED' ? 'Settled' : 'Closed'}
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {bet.endTime ? formatDate(bet.endTime) : 'N/A'}
          </p>
        </div>
      </div>

      {/* ── User's Wager ── */}
      {userWager && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Your Wager
          </h3>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <div>
              <p className="text-[11px] text-blue-600 mb-1">Selected Outcome</p>
              <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${getOutcomeColor(userWager.outcome?.label || '').bg} ${getOutcomeColor(userWager.outcome?.label || '').border} border`}>
                <div className={`w-2 h-2 rounded-full ${getOutcomeColor(userWager.outcome?.label || '').bar}`} />
                <span className={`text-sm font-semibold ${getOutcomeColor(userWager.outcome?.label || '').text}`}>
                  {userWager.outcome?.label || 'N/A'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-blue-600 mb-1">Amount Staked</p>
              <p className="text-base font-bold text-blue-900">${userWager.amount?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-blue-600 mb-1">Placed On</p>
              <p className="text-sm font-medium text-blue-900">
                {userWager.createdAt ? formatDate(userWager.createdAt) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Outcome Distribution ── */}
      {bet.outcomes && bet.outcomes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Outcome Distribution</h3>
          <div className="space-y-2.5">
            {(() => {
              // Determine if this is an LMSR market with price data
              const hasLMSRPrices = bet.outcomes.some((o: any) => o.currentPrice != null && o.currentPrice > 0);
              
              return bet.outcomes.map((outcome: any) => {
                let percentage: number;
                let subLabel: string;
                
                if (hasLMSRPrices) {
                  // Use LMSR prices for distribution (probability-based)
                  percentage = (outcome.currentPrice || 0) * 100;
                  subLabel = `${(outcome.currentPrice * 100).toFixed(1)}¢`;
                } else {
                  // Fallback to wager-based distribution  
                  const totalPeople = bet.outcomes?.reduce((sum: number, o: any) => sum + (o.totalWagers || 0), 0) || 0;
                  const outcomePeople = outcome.totalWagers || 0;
                  percentage = totalPeople > 0 ? (outcomePeople / totalPeople) * 100 : 0;
                  subLabel = `${outcomePeople} ${outcomePeople === 1 ? 'person' : 'people'}`;
                }

                const isUserOutcome = userWager?.outcome?.id === outcome.id;
                const isWinningOutcome = bet.status === 'RESOLVED' && userWager?.status === 'WON' && isUserOutcome;
                const color = getOutcomeColor(outcome.text || outcome.label || '');
              
              return (
                <div 
                  key={outcome.id} 
                  className={`border rounded-xl p-3 transition-all ${
                    isWinningOutcome 
                      ? `${color.border} ${color.bg} ring-2 ${color.ring}` 
                      : isUserOutcome 
                        ? 'border-blue-300 bg-blue-50/50 ring-1 ring-blue-200'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color.bar}`} />
                      <span className={`font-medium text-sm truncate ${isUserOutcome ? color.text : 'text-gray-900 dark:text-white'}`}>
                        {outcome.text || outcome.label || 'Unknown'}
                      </span>
                      {isUserOutcome && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 bg-blue-100 rounded-full ring-1 ring-blue-200 flex-shrink-0">
                          Your Pick
                        </span>
                      )}
                      {isWinningOutcome && (
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${color.text}`}>
                        {percentage.toFixed(0)}%
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {subLabel}
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${color.bar}`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              );
            });
            })()}
          </div>
        </div>
      )}

      {/* ── Settlement / Cancelled Info ── */}
      {bet.status === 'RESOLVED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-sm font-semibold text-emerald-900">Settled</h3>
          </div>
          <p className="text-emerald-700 text-sm">
            This bet has been resolved. Check your balance for any winnings.
          </p>
        </div>
      )}
      
      {bet.status === 'CANCELLED' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-sm font-semibold text-red-900">Cancelled</h3>
          </div>
          <p className="text-red-700 text-sm">
            This bet has been cancelled. All wagers have been refunded.
          </p>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className={`flex gap-3 pt-1 ${isMobile ? 'flex-col' : ''}`}>
        <button
          onClick={() => onNavigate(`/bets/${bet.id}`)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          {bet.status === 'OPEN' ? 'Trade / Sell Shares' : 'View Market'}
        </button>
      </div>
    </div>
  );
}