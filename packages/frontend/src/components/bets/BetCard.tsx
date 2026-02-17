'use client';

import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { OutcomeDistributionBar } from '@/components/ui/OutcomeDistributionBar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { usePlaceBet } from '@/hooks/useApi';

interface BetCardProps {
  bet: {
    id: string;
    question: string;
    description?: string;
    category: string;
    endTime: Date | string;
    status: string;
    totalPool: number;
    outcomes: {
      id: string;
      text: string;
      totalStake: number;
    }[];
    _count?: {
      participants: number;
    };
  };
}

export function BetCard({ bet }: BetCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [betPlaced, setBetPlaced] = useState(false);
  const [betError, setBetError] = useState('');
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const placeBetMutation = usePlaceBet();
  
  const statusColors = {
    OPEN: 'bg-green-100 text-green-800',
    CLOSED: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    PAUSED: 'bg-orange-100 text-orange-800',
    DRAFT: 'bg-gray-100 text-gray-800',
  };

  const categoryColors = {
    SPORTS: 'bg-orange-500',
    POLITICS: 'bg-blue-500',
    ENTERTAINMENT: 'bg-purple-500',
    TECHNOLOGY: 'bg-yellow-500',
    CULTURE: 'bg-cyan-500',
    OTHER: 'bg-gray-500',
  };

  const handleOutcomeClick = (outcomeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!user) {
      alert('Please sign in to select an outcome');
      return;
    }
    if (outcomeId === selectedOutcome) {
      setSelectedOutcome(null);
      setAmount('');
    } else {
      setSelectedOutcome(outcomeId);
    }
    setBetError('');
    setBetPlaced(false);
  };

  const handleBetClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Please sign in to place a bet');
      return;
    }
    if (!selectedOutcome) {
      setBetError('Please select an outcome first');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1) {
      setBetError('Please enter a valid amount (minimum 1 coin)');
      return;
    }
    if (numAmount > (user.balance ?? 0)) {
      setBetError('Insufficient balance');
      return;
    }
    setBetError('');
    try {
      await placeBetMutation.mutateAsync({
        betId: bet.id,
        outcomeId: selectedOutcome,
        amount: numAmount,
      });
      setBetPlaced(true);
      setSelectedOutcome(null);
      setAmount('');
    } catch (err: any) {
      setBetError(err?.message || 'Failed to place bet');
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setShowShareMenu(!showShareMenu);
  };

  const shareToSocial = (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/bets/${bet.id}`;
    const text = `Check out this bet: ${bet.question}`;
    
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
        alert('Link copied to clipboard!');
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
        
        {/* Share button - only show for logged-in users */}
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
          
          {/* Share menu dropdown */}
          {showShareMenu && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
              <div className="py-2">
                <button
                  onClick={(e) => shareToSocial('twitter', e)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <div className="w-4 h-4 bg-blue-400 rounded-sm flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  Share on Twitter
                </button>
                <button
                  onClick={(e) => shareToSocial('facebook', e)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  Share on Facebook
                </button>
                <button
                  onClick={(e) => shareToSocial('whatsapp', e)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </div>
                  Share on WhatsApp
                </button>
                <button
                  onClick={(e) => shareToSocial('telegram', e)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  Share on Telegram
                </button>
                <hr className="my-1" />
                <button
                  onClick={(e) => shareToSocial('copy', e)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
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
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[bet.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
          {bet.status}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${categoryColors[bet.category as keyof typeof categoryColors] || categoryColors.OTHER}`}>
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

      {/* Outcome Distribution - only show after user has placed a bet */}
      {betPlaced && bet.outcomes && bet.outcomes.length > 0 && (
        <div className="mb-4">
          <OutcomeDistributionBar outcomes={bet.outcomes} />
        </div>
      )}

      {/* Outcomes - Interactive for logged-in users */}
      {user && bet.status === 'OPEN' && bet.outcomes && bet.outcomes.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Select an outcome:</p>
          <div className="space-y-2">
            {bet.outcomes.map((outcome) => {
              const totalStake = bet.outcomes.reduce((sum, o) => sum + o.totalStake, 0);
              const probability = totalStake > 0 ? (outcome.totalStake / totalStake) * 100 : 0;
              const isSelected = selectedOutcome === outcome.id;
              
              return (
                <button
                  key={outcome.id}
                  onClick={(e) => handleOutcomeClick(outcome.id, e)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {outcome.text}
                    </span>
                    {betPlaced && (
                      <div className="text-right">
                        <div className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                          {probability.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Amount Input - shown after selecting an outcome */}
      {user && bet.status === 'OPEN' && selectedOutcome && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-blue-900 mb-1">
            Enter amount to stake
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setBetError('');
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter amount"
                className="w-full pl-7 pr-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Balance: <span className="font-semibold">${user.balance?.toLocaleString() ?? 0}</span> coins
          </p>
        </div>
      )}

      {/* Success message */}
      {betPlaced && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <p className="text-sm font-medium text-green-800">Bet placed successfully!</p>
        </div>
      )}

      {/* Error message */}
      {betError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <p className="text-sm font-medium text-red-800">{betError}</p>
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-600">Total Pool</p>
            <p className="text-lg font-bold text-gray-900">${bet.totalPool.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Participants</p>
            <p className="text-lg font-bold text-gray-900">{bet._count?.participants || 0}</p>
          </div>
        </div>
        
        {/* Different buttons based on auth status */}
        {user ? (
          bet.status === 'OPEN' ? (
            <button 
              onClick={handleBetClick}
              disabled={!selectedOutcome || !amount || Number(amount) < 1 || placeBetMutation.isPending}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                selectedOutcome && amount && Number(amount) >= 1 && !placeBetMutation.isPending
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {placeBetMutation.isPending
                ? 'Placing...'
                : !selectedOutcome
                ? 'Select Outcome'
                : !amount || Number(amount) < 1
                ? 'Enter Amount'
                : `Place Bet · $${Number(amount).toLocaleString()}`}
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/bets/${bet.id}`);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              View Details
            </button>
          )
        ) : (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/bets/${bet.id}`);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            View Details
          </button>
        )}
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
