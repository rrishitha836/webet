'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import UserLayout from '@/components/layout/UserLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CATEGORIES = ['SPORTS', 'POLITICS', 'ENTERTAINMENT', 'TECHNOLOGY', 'CULTURE', 'OTHER'];

function useMyProposals() {
  return useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/users/proposals`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch proposals');
      const data = await res.json();
      return data.data;
    },
  });
}

function useSubmitProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`${API_URL}/api/users/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to submit proposal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
}

export default function ProposeMarketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: proposals, isLoading: loadingProposals } = useMyProposals();
  const submitProposal = useSubmitProposal();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [outcomes, setOutcomes] = useState(['Yes', 'No']);
  const [closeTime, setCloseTime] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Please sign in to propose markets.</p>
      </div>
    );
  }

  const addOutcome = () => {
    if (outcomes.length < 10) setOutcomes([...outcomes, '']);
  };
  const removeOutcome = (idx: number) => {
    if (outcomes.length > 2) setOutcomes(outcomes.filter((_, i) => i !== idx));
  };
  const updateOutcome = (idx: number, val: string) => {
    setOutcomes(outcomes.map((o, i) => (i === idx ? val : o)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredOutcomes = outcomes.map(o => o.trim()).filter(Boolean);
    if (filteredOutcomes.length < 2) {
      toast.error('At least 2 outcomes required');
      return;
    }
    try {
      await submitProposal.mutateAsync({
        title,
        description,
        category,
        outcomes: filteredOutcomes,
        suggestedCloseTime: closeTime || null,
      });
      toast.success('Proposal submitted! An admin will review it.');
      setTitle('');
      setDescription('');
      setOutcomes(['Yes', 'No']);
      setCloseTime('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    APPROVED: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    REJECTED: 'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
  };

  return (
    <UserLayout>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-full">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Propose a Market</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Suggest a prediction market for the community. Admins will review and publish approved proposals.</p>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question / Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Will Bitcoin reach $100k by end of 2026?"
              maxLength={200}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <div className="text-xs text-gray-400 mt-1">{title.length}/200</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, resolution criteria, etc."
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-800"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Suggested Close Date</label>
              <input
                type="datetime-local"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Outcomes *</label>
            <div className="space-y-2">
              {outcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={outcome}
                    onChange={(e) => updateOutcome(idx, e.target.value)}
                    placeholder={`Outcome ${idx + 1}`}
                    maxLength={100}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  {outcomes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOutcome(idx)}
                      className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {outcomes.length < 10 && (
              <button
                type="button"
                onClick={addOutcome}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Outcome
              </button>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitProposal.isPending || !title.trim()}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {submitProposal.isPending ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>

        {/* My Proposals */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Proposals</h2>
          {loadingProposals ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : !proposals || proposals.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="text-gray-300 mb-3">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No proposals yet. Submit one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((p: any) => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{p.title}</h3>
                      {p.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{p.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">{p.category}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {p.outcomes?.length || 0} outcomes
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusColors[p.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {p.status}
                    </span>
                  </div>
                  {p.adminNotes && (
                    <div className="mt-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Admin note:</span> {p.adminNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </UserLayout>
  );
}
