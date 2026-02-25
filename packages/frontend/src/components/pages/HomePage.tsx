"use client";

import { useState } from "react";
import { useActiveBets } from "@/hooks/useApi";
import { BetCard } from "@/components/bets/BetCard";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import UserLayout from "@/components/layout/UserLayout";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("trending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const { user } = useAuth();

  const { data: bets, isLoading } = useActiveBets(
    {
      category: selectedCategory || undefined,
      sort: sortBy,
      search: searchQuery || undefined,
    },
    !!user
  );

  const categories = [
    "ALL",
    "SPORTS",
    "POLITICS",
    "ENTERTAINMENT",
    "TECHNOLOGY",
    "CULTURE",
    "OTHER",
  ];

  // Not logged in — show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center max-w-2xl mx-auto px-4">
              <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
                WeBet
              </h1>
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Welcome!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Bet on real-world events with play money.
                <br />
                Compete with friends and climb the leaderboards!
                <br />
                Join our community and start betting today.
              </p>
              <div className="max-w-md mx-auto">
                <GoogleLoginButton redirectUrl="/dashboard" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                Sign in with your Google account to get started
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Logged in — show markets inside UserLayout
  return (
    <UserLayout>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

          {/* ── Category Filters + Search Bar ── */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Filters */}
            <div className="overflow-x-auto scrollbar-hide flex-shrink-0">
              <div className="flex gap-2 min-w-max pb-0.5">
                {categories.map((category) => {
                  const isActive =
                    (category === "ALL" && !selectedCategory) ||
                    selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() =>
                        setSelectedCategory(category === "ALL" ? "" : category)
                      }
                      className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                          : "bg-white dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200/80 dark:border-gray-700/60"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="relative sm:ml-auto w-full sm:w-64 lg:w-72">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search markets..."
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  if (val === "") setSearchQuery("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSearchQuery(searchInput);
                }}
                className="w-full pl-10 pr-9 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 outline-none transition-all duration-200 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* ── Sort Controls ── */}
          <div className="mb-6 flex items-center gap-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium mr-1">
              Sort:
            </span>
            <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-xl p-0.5 gap-0.5 border border-gray-200/60 dark:border-gray-700/40">
              {[
                { value: "trending", label: "Trending", icon: "\u{1F525}" },
                { value: "closing_soon", label: "Closing Soon", icon: "\u23F3" },
                { value: "newest", label: "Newest", icon: "\u2728" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200 ${
                    sortBy === option.value
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Bets Grid ── */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400" />
            </div>
          ) : bets && bets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {bets.map((bet: any) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/60">
              <svg
                className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">
                {searchQuery
                  ? `No markets match "${searchQuery}"`
                  : selectedCategory
                  ? `No ${selectedCategory.toLowerCase()} markets`
                  : "No active markets"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? "Try a different search term or browse all categories."
                  : "New markets are added regularly. Check back soon or try a different category!"}
              </p>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchInput("");
                    setSelectedCategory("");
                  }}
                  className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
