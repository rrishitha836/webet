'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';

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
    setIsExecutingAgent(true);
    setError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/execute-agent`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review AI Bets</h1>
          <p className="text-gray-600">Review and publish AI-generated betting suggestions</p>
        </div>
        <button
          onClick={executeAgent}
          disabled={isExecutingAgent}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isExecutingAgent ? (
            <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                </svg>
                Executing Agent...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                </svg>
                Execute AI Agent
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading AI suggestions...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Suggestions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pending Review ({pendingSuggestions.length})
                </h2>
              </div>
              <div className="p-6">
                {pendingSuggestions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending AI suggestions</p>
                ) : (
                  <div className="space-y-4">
                    {pendingSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{suggestion.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">Category: {suggestion.category}</p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleApprove(suggestion.id)}
                              disabled={processingId === suggestion.id}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {processingId === suggestion.id ? 'Publishing...' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleReject(suggestion.id)}
                              disabled={processingId === suggestion.id}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {processingId === suggestion.id ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{suggestion.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Close Time:</span>
                            <p className="text-gray-600">{new Date(suggestion.suggestedDeadline).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium">Outcomes:</span>
                            <p className="text-gray-600">{Array.isArray(suggestion.outcomes) ? suggestion.outcomes.map(o => typeof o === 'string' ? o : o.label).join(', ') : ''}</p>
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>
                            <p className="text-gray-600">{new Date(suggestion.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Approved Suggestions */}
            {approvedSuggestions.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-green-700">
                    Published ({approvedSuggestions.length})
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {approvedSuggestions.slice(0, 5).map((suggestion) => (
                      <div key={suggestion.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                        <h3 className="text-lg font-medium text-gray-900">{suggestion.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Published • {suggestion.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rejected Suggestions */}
            {rejectedSuggestions.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-red-700">
                    Rejected ({rejectedSuggestions.length})
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {rejectedSuggestions.slice(0, 5).map((suggestion) => (
                      <div key={suggestion.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <h3 className="text-lg font-medium text-gray-900">{suggestion.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Rejected • {suggestion.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
    </AdminLayout>
  );
}