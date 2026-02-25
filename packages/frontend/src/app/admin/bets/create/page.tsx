'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

interface BetOutcome {
  label: string;
  sortOrder: number;
}

export default function CreateBetPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'SPORTS',
    resolutionCriteria: '',
    closeTime: '',
    tags: '',
    referenceLinks: ''
  });
  const [outcomes, setOutcomes] = useState<BetOutcome[]>([
    { label: 'Yes', sortOrder: 0 },
    { label: 'No', sortOrder: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { admin } = useAuth();
  const router = useRouter();

  const categories = [
    'SPORTS',
    'POLITICS', 
    'ENTERTAINMENT',
    'TECHNOLOGY',
    'CULTURE',
    'OTHER'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...outcomes];
    newOutcomes[index].label = value;
    setOutcomes(newOutcomes);
  };

  const addOutcome = () => {
    setOutcomes(prev => [
      ...prev,
      { label: '', sortOrder: prev.length }
    ]);
  };

  const removeOutcome = (index: number) => {
    if (outcomes.length > 2) {
      const newOutcomes = outcomes.filter((_, i) => i !== index);
      // Update sort order
      newOutcomes.forEach((outcome, i) => {
        outcome.sortOrder = i;
      });
      setOutcomes(newOutcomes);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate form
      if (!formData.title || !formData.description || !formData.closeTime) {
        throw new Error('Please fill in all required fields');
      }

      if (outcomes.some(o => !o.label.trim())) {
        throw new Error('All outcomes must have labels');
      }

      const closeTime = new Date(formData.closeTime);
      if (closeTime <= new Date()) {
        throw new Error('Close time must be in the future');
      }

      // Prepare data
      const betData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        resolutionCriteria: formData.resolutionCriteria,
        closeTime: closeTime.toISOString(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        referenceLinks: formData.referenceLinks.split('\n').map(l => l.trim()).filter(Boolean),
        outcomes: outcomes.map(o => ({
          label: o.label,
          sortOrder: o.sortOrder
        }))
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(betData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create bet');
      }

      const result = await response.json();
      
      // Success - redirect to dashboard or bet page
      toast.success('Bet created successfully!');
      router.push('/admin/dashboard');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader 
        title="Create New Bet" 
        subtitle="Create a new betting market manually"
      />
      
      <div className="p-8">
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Will Bitcoin reach $100,000 by end of 2026?"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detailed description of what this bet is about..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Close Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Close Time *
            </label>
            <input
              type="datetime-local"
              name="closeTime"
              value={formData.closeTime}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Resolution Criteria */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resolution Criteria
            </label>
            <textarea
              name="resolutionCriteria"
              value={formData.resolutionCriteria}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="How will this bet be resolved? What are the specific conditions for each outcome?"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="bitcoin, cryptocurrency, price"
            />
          </div>

          {/* Reference Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reference Links (one per line)
            </label>
            <textarea
              name="referenceLinks"
              value={formData.referenceLinks}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/relevant-article"
            />
          </div>
        </div>

        {/* Outcomes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Outcomes *
          </label>
          <div className="space-y-3">
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={outcome.label}
                  onChange={(e) => handleOutcomeChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Outcome ${index + 1}`}
                />
                {outcomes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOutcome(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOutcome}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Add Outcome
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Bet...' : 'Create Bet'}
          </button>
        </div>
      </form>
      </div>
    </AdminLayout>
  );
}