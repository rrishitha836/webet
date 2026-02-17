'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useBet, usePlaceBet } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { OutcomeDistributionBar } from '@/components/ui/OutcomeDistributionBar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const preSelectedOutcome = searchParams.get('outcome');
  
  const { data: bet, isLoading } = useBet(id);
  const { user } = useAuth();
  const router = useRouter();
  const [showPlaceBetModal, setShowPlaceBetModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(preSelectedOutcome);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  const placeBetMutation = usePlaceBet();

  // Auto-open bet modal if outcome is pre-selected and user is logged in
  useEffect(() => {
    if (preSelectedOutcome && user && bet) {
      setShowPlaceBetModal(true);
    }
  }, [preSelectedOutcome, user, bet]);

  const handlePlaceBet = async () => {
    if (!selectedOutcome) return;
    
    try {
      await placeBetMutation.mutateAsync({
        betId: id,
        outcomeId: selectedOutcome,
        amount: betAmount,
      });
      setShowPlaceBetModal(false);
      setSelectedOutcome(null);
      setBetAmount(10);
    } catch (error) {
      console.error('Failed to place bet:', error);
    }
  };

  const shareToSocial = (platform: string) => {
    const url = `${window.location.origin}/bets/${bet?.id}`;
    const text = `Check out this bet: ${bet?.question}`;
    
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bet not found</h2>
        <Button onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-800',
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    CLOSED: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    PAUSED: 'bg-orange-100 text-orange-800',
    DRAFT: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{bet.question}</h1>
              {bet.description && (
                <p className="text-gray-600 text-lg">{bet.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[bet.status] || 'bg-gray-100 text-gray-800'}`}>
                {bet.status}
              </span>
              
              {/* Share Button */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </button>
                  
                  {/* Share menu dropdown */}
                  {showShareMenu && (
                    <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                      <div className="py-2">
                        <button
                          onClick={() => shareToSocial('twitter')}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <div className="w-4 h-4 bg-blue-400 rounded-sm"></div>
                          Share on Twitter
                        </button>
                        <button
                          onClick={() => shareToSocial('facebook')}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
                          Share on Facebook
                        </button>
                        <button
                          onClick={() => shareToSocial('whatsapp')}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                          Share on WhatsApp
                        </button>
                        <button
                          onClick={() => shareToSocial('telegram')}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                          Share on Telegram
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => shareToSocial('copy')}
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Bet Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Countdown Timer */}
            {bet.status === 'OPEN' && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Remaining</h3>
                <CountdownTimer targetDate={bet.endTime} />
              </Card>
            )}

            {/* Outcomes */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Outcomes</h3>
              <OutcomeDistributionBar outcomes={bet.outcomes} />
              
              <div className="mt-6 space-y-3">
                {bet.outcomes.map((outcome: any) => {
                  const totalStake = bet.outcomes.reduce((sum: number, o: any) => sum + o.totalStake, 0);
                  const probability = totalStake > 0 ? (outcome.totalStake / totalStake) * 100 : 0;
                  const potentialReturn = outcome.totalStake > 0 ? (totalStake / outcome.totalStake).toFixed(2) : '0.00';
                  
                  return (
                    <button
                      key={outcome.id}
                      onClick={() => {
                        if (!user) {
                          alert('Please sign in to place a bet');
                          return;
                        }
                        if (bet.status !== 'OPEN') {
                          alert('This bet is not open for wagering');
                          return;
                        }
                        setSelectedOutcome(outcome.id);
                        setShowPlaceBetModal(true);
                      }}
                      className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{outcome.text}</span>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">{probability.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">{potentialReturn}x return</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column - Bet Info */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bet Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="text-base font-medium text-gray-900">{bet.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pool</p>
                  <p className="text-2xl font-bold text-gray-900">${bet.totalPool.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="text-base font-medium text-gray-900">{bet._count?.participants || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Time</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(bet.endTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {bet.status === 'OPEN' && user && (
              <Card className="bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Balance</h3>
                <p className="text-3xl font-bold text-blue-600">${user.balance.toLocaleString()}</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Place Bet Modal */}
      <Modal
        isOpen={showPlaceBetModal}
        onClose={() => {
          setShowPlaceBetModal(false);
          setSelectedOutcome(null);
        }}
        title="Place Your Bet"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Selected Outcome</p>
            <p className="text-lg font-semibold text-gray-900">
              {bet.outcomes.find((o: any) => o.id === selectedOutcome)?.text}
            </p>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Bet Amount
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              max={user?.balance || 0}
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Available balance: ${user?.balance.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Potential Return</p>
            <p className="text-2xl font-bold text-green-600">
              ${(() => {
                const totalStake = bet.outcomes.reduce((sum: number, o: any) => sum + o.totalStake, 0);
                const outcomeStake = bet.outcomes.find((o: any) => o.id === selectedOutcome)?.totalStake || 1;
                const multiplier = totalStake > 0 ? totalStake / outcomeStake : 1;
                return (betAmount * multiplier).toFixed(2);
              })()}
            </p>
          </div>

          {placeBetMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {placeBetMutation.error instanceof Error ? placeBetMutation.error.message : 'Failed to place bet'}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowPlaceBetModal(false);
                setSelectedOutcome(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlaceBet}
              isLoading={placeBetMutation.isPending}
              disabled={betAmount <= 0 || betAmount > (user?.balance || 0)}
              className="flex-1"
            >
              Place Bet
            </Button>
          </div>
        </div>
      </Modal>
      
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
