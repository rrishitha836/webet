'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ViewToggle from '@/components/ui/ViewToggle';

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  resolutionCriteria: string;
  suggestedDeadline: string;
  confidenceScore?: number;
  outcomes: string[] | { label: string; odds?: number }[];
}

export default function AISuggestionsPage() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isExecutingAgent, setIsExecutingAgent] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { admin } = useAuth();
  const router = useRouter();

  // Redirect if not admin
  useEffect(() => {
    if (!admin) {
      router.push('/admin/login');
    }
  }, [admin, router]);

  // Fetch AI suggestions
  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/ai-suggestions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI suggestions');
      }

      const data = await response.json();
      setSuggestions(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchSuggestions();
    }
  }, [admin]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/ai-suggestions/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to approve suggestion');
      }

      // Refresh the list
      await fetchSuggestions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve suggestion');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/ai-suggestions/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reject suggestion');
      }

      // Refresh the list
      await fetchSuggestions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject suggestion');
    } finally {
      setProcessingId(null);
    }
  };

  const executeAgent = async () => {
    console.log("👾👾👾👾Executing AI agent...");
    setIsExecutingAgent(true);
    setError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/execute-agent`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      console.log('Agent execution response:', data);
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to execute AI agent');
      }

      const betsCreated = data.data?.betsCreated || 0;
      const betsSkipped = data.data?.betsSkipped || 0;
      const msg = data.message || `Agent finished. ${betsCreated} bets created, ${betsSkipped} skipped.`;
      alert(msg);
      
      // Refresh the list after a short delay to let backend process
      setTimeout(() => {
        fetchSuggestions();
      }, 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to execute AI agent';
      setError(msg);
      alert(msg);
    } finally {
      setIsExecutingAgent(false);
    }
  };

  if (!admin) {
    return null;
  }

  const pendingSuggestions = suggestions.filter(s => s.status === 'PENDING');
  const approvedSuggestions = suggestions.filter(s => s.status === 'APPROVED');
  const rejectedSuggestions = suggestions.filter(s => s.status === 'REJECTED');

  return (
    <AdminLayout>
      <AdminPageHeader 
        title="Review AI Bets" 
        subtitle="Review and publish AI-generated betting suggestions"
        actions={
          <button
            onClick={executeAgent}
            disabled={isExecutingAgent}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isExecutingAgent ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running Agent…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Execute AI Agent
              </>
            )}
          </button>
        }
      />
      
      <div className="p-8">
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-200 border-t-purple-600"></div>
          <p className="mt-4 text-sm text-gray-500">Loading suggestions…</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Pending Review ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {pendingSuggestions.length}
                </span>
                <h2 className="text-lg font-semibold text-gray-900">Pending Review</h2>
              </div>
              <ViewToggle view={viewMode} onChange={setViewMode} />
            </div>

            {pendingSuggestions.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
                <p className="text-gray-400 text-sm">No pending suggestions — run the AI agent to generate new bets.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
                {pendingSuggestions.map((suggestion) => {
                  const isProcessing = processingId === suggestion.id;
                  const outcomesText = Array.isArray(suggestion.outcomes)
                    ? suggestion.outcomes.map(o => typeof o === 'string' ? o : o.label).join(', ')
                    : '';

                  if (viewMode === 'list') {
                    return (
                      <div
                        key={suggestion.id}
                        className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all p-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Left content */}
                          <div className="flex-1 min-w-0">
                            {/* Badge row */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                                {suggestion.category}
                              </span>
                              {suggestion.confidenceScore != null && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  suggestion.confidenceScore >= 0.8
                                    ? 'bg-green-100 text-green-800'
                                    : suggestion.confidenceScore >= 0.5
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                }`}>
                                  {Math.round(suggestion.confidenceScore * 100)}% confidence
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Pending
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold text-gray-900 leading-snug mb-1.5">{suggestion.title}</h3>

                            {/* Description */}
                            <p className="text-sm text-gray-500 leading-relaxed mb-5">{suggestion.description}</p>

                            {/* Metadata footer */}
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Close Time</p>
                                  <p className="text-sm font-medium text-gray-800">{new Date(suggestion.suggestedDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Outcomes</p>
                                  <p className="text-sm font-medium text-gray-800">{outcomesText}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Created</p>
                                  <p className="text-sm font-medium text-gray-800">{new Date(suggestion.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right actions */}
                          <div className="flex sm:flex-col items-center gap-3 shrink-0 sm:pt-6">
                            <button
                              onClick={() => handleApprove(suggestion.id)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm hover:shadow-md"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {isProcessing ? 'Publishing…' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleReject(suggestion.id)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-2 bg-white text-red-600 border-2 border-red-200 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {isProcessing ? 'Rejecting…' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={suggestion.id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all p-5"
                    >
                      {/* Top row: title + actions */}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 leading-snug">{suggestion.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {suggestion.category}
                            </span>
                            {suggestion.confidenceScore != null && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                suggestion.confidenceScore >= 0.8
                                  ? 'bg-green-50 text-green-700 border-green-100'
                                  : suggestion.confidenceScore >= 0.5
                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                    : 'bg-red-50 text-red-700 border-red-100'
                              }`}>
                                {Math.round(suggestion.confidenceScore * 100)}% confidence
                              </span>
                            )}
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                              Pending
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApprove(suggestion.id)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {isProcessing ? 'Publishing…' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleReject(suggestion.id)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {isProcessing ? 'Rejecting…' : 'Reject'}
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{suggestion.description}</p>

                      {/* Metadata grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3.5 text-sm">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Close Time</p>
                            <p className="text-gray-700 font-medium">{new Date(suggestion.suggestedDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                          </svg>
                          <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Outcomes</p>
                            <p className="text-gray-700 font-medium">{outcomesText}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          <div>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Created</p>
                            <p className="text-gray-700 font-medium">{new Date(suggestion.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Published ── */}
          {approvedSuggestions.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  {approvedSuggestions.length}
                </span>
                <h2 className="text-lg font-semibold text-gray-900">Published</h2>
              </div>
              <div className="grid gap-3">
                {approvedSuggestions.slice(0, 5).map((suggestion) => (
                  <div key={suggestion.id} className="bg-white rounded-xl border border-emerald-200 p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{suggestion.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Published • {suggestion.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Rejected ── */}
          {rejectedSuggestions.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                  {rejectedSuggestions.length}
                </span>
                <h2 className="text-lg font-semibold text-gray-900">Rejected</h2>
              </div>
              <div className="grid gap-3">
                {rejectedSuggestions.slice(0, 5).map((suggestion) => (
                  <div key={suggestion.id} className="bg-white rounded-xl border border-red-200 p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{suggestion.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Rejected • {suggestion.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
      </div>
    </AdminLayout>
  );
}