'use client';

import { useState } from 'react';
import { useActiveBets } from '@/hooks/useApi';
import { BetCard } from '@/components/bets/BetCard';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { useSocket } from '@/hooks/useSocket';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { user, logout } = useAuth();
  const { isConnected } = useSocket(); // Initialize WebSocket connection

  // Only load bets for logged-in users
  const { data: bets, isLoading } = useActiveBets({ 
    category: selectedCategory || undefined
  }, !!user); // Pass enabled as second parameter

  const categories = ['ALL', 'SPORTS', 'POLITICS', 'ENTERTAINMENT', 'TECHNOLOGY', 'CULTURE', 'OTHER'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">WeBet</h1>
              {isConnected && user && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                  <a
                    href="/dashboard"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Dashboard
                  </a>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Social Betting Platform
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        {!user ? (
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center max-w-2xl mx-auto px-4">
              {/* Logo/Brand */}
              <h1 className="text-6xl font-bold text-gray-900 mb-6">WeBet</h1>
              
              {/* Welcome Message */}
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome!</h2>
              
              {/* Platform Info */}
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Bet on real-world events with play money.<br />
                Compete with friends and climb the leaderboards!<br />
                Join our community and start betting today.
              </p>
              
              {/* Google Login */}
              <div className="max-w-md mx-auto">
                <GoogleLoginButton redirectUrl="/dashboard" />
              </div>
              
              {/* Additional Info */}
              <p className="text-sm text-gray-500 mt-6">
                Sign in with your Google account to get started
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h2>
              <p className="text-lg opacity-90">
                Check out the latest bets or visit your dashboard to manage your bets.
              </p>
            </div>

            {/* Category Filters - Only show for logged in users */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Category</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category === 'ALL' ? '' : category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      (category === 'ALL' && !selectedCategory) || selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Bets Grid - Only show for logged in users */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : bets && bets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bets.map((bet: any) => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active bets</h3>
                <p className="text-gray-600">Check back soon for new betting opportunities!</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
