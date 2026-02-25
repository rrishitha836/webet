'use client';

import { useState } from 'react';
import { useActiveBets } from '@/hooks/useApi';
import { BetCard } from '@/components/bets/BetCard';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { useSocket } from '@/hooks/useSocket';
import { ActivityFeed } from '@/components/social/ActivityFeed';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('trending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const { user } = useAuth();
  const { isConnected } = useSocket();

  const { data: bets, isLoading } = useActiveBets({ 
    category: selectedCategory || undefined,
    sort: sortBy,
    search: searchQuery || undefined,
  }, !!user);

  const categories = ['ALL', 'SPORTS', 'POLITICS', 'ENTERTAINMENT', 'TECHNOLOGY', 'CULTURE', 'OTHER'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        {!user ? (
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center max-w-2xl mx-auto px-4">
              {/* Logo/Brand */}
              <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">WeBet</h1>
              
              {/* Welcome Message */}
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Welcome!</h2>
              
              {/* Platform Info */}
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Bet on real-world events with play money.<br />
                Compete with friends and climb the leaderboards!<br />
                Join our community and start betting today.
              </p>
              
              {/* Google Login */}
              <div className="max-w-md mx-auto">
                <GoogleLoginButton redirectUrl="/dashboard" />
              </div>
              
              {/* Additional Info */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                Sign in with your Google account to get started
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-xl">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSearchQuery(searchInput);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(''); setSearchQuery(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filters & Sort */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category === 'ALL' ? '' : category)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                        (category === 'ALL' && !selectedCategory) || selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sort:</span>
                {[
                  { value: 'trending', label: '🔥 Trending' },
                  { value: 'closing_soon', label: '⏰ Closing Soon' },
                  { value: 'newest', label: '🆕 Newest' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      sortBy === option.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Grid: Bets + Activity Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Bets Grid */}
              <div className="lg:col-span-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                  </div>
                ) : bets && bets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {bets.map((bet: any) => (
                      <BetCard key={bet.id} bet={bet} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="text-gray-300 mb-5">
                      <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchQuery ? `No markets match "${searchQuery}"` : selectedCategory ? `No ${selectedCategory.toLowerCase()} markets` : 'No active markets'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      {searchQuery
                        ? 'Try a different search term or browse all categories.'
                        : 'New markets are added regularly. Check back soon or try a different category!'}
                    </p>
                    {(searchQuery || selectedCategory) && (
                      <button
                        onClick={() => { setSearchQuery(''); setSearchInput(''); setSelectedCategory(''); }}
                        className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Activity Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <ActivityFeed />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
