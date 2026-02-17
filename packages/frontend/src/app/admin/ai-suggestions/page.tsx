'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAISuggestions, useApproveAISuggestion, useRejectAISuggestion } from '@/hooks/useAdminApi';
import { AdminProtectedRoute } from '@/components/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

function AISuggestionsContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const [filter, setFilter] = useState<string>(statusParam || 'PENDING');
  const { data: suggestions, isLoading } = useAISuggestions(filter);
  const approveMutation = useApproveAISuggestion();
  const rejectMutation = useRejectAISuggestion();
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Update filter if URL param changes
  useEffect(() => {
    if (statusParam) {
      setFilter(statusParam);
    }
  }, [statusParam]);

  const handleApprove = async (id: string) => {
    if (confirm('Are you sure you want to approve this suggestion?')) {
      try {
        await approveMutation.mutateAsync(id);
      } catch (error) {
        alert('Failed to approve suggestion');
      }
    }
  };

  const handleReject = async (id: string) => {
    if (confirm('Are you sure you want to reject this suggestion?')) {
      try {
        await rejectMutation.mutateAsync(id);
      } catch (error) {
        alert('Failed to reject suggestion');
      }
    }
  };

  const filters = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Suggestions Queue</h1>
        <p className="text-gray-600">Review and manage AI-generated bet suggestions</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f === 'ALL' ? '' : f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                (f === 'ALL' && !filter) || filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : suggestions && suggestions.length > 0 ? (
        <div className="space-y-4">
          {suggestions.map((suggestion: any) => (
            <Card key={suggestion.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{suggestion.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        suggestion.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : suggestion.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {suggestion.status}
                    </span>
                  </div>
                  
                  {suggestion.description && (
                    <p className="text-gray-600 mb-3">{suggestion.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Category</p>
                      <p className="text-sm font-medium text-gray-900">{suggestion.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Confidence</p>
                      <p className="text-sm font-medium text-blue-600">
                        {(suggestion.confidenceScore * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Deadline</p>
                      <p className="text-sm font-medium text-gray-900">
                        {suggestion.suggestedDeadline ? new Date(suggestion.suggestedDeadline).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Created</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(suggestion.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {suggestion.outcomes && (Array.isArray(suggestion.outcomes) ? suggestion.outcomes.length > 0 : true) && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Suggested Outcomes:</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(suggestion.outcomes) ? suggestion.outcomes : []).map((outcome: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {outcome}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {suggestion.status === 'PENDING' && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSuggestion(suggestion);
                        setShowPreviewModal(true);
                      }}
                      variant="outline"
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleApprove(suggestion.id)}
                      isLoading={approveMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(suggestion.id)}
                      isLoading={rejectMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
            <p className="text-gray-600">AI suggestions will appear here for review</p>
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedSuggestion(null);
        }}
        title="Preview Suggestion"
        size="lg"
      >
        {selectedSuggestion && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Question</h4>
              <p className="text-gray-700">{selectedSuggestion.title}</p>
            </div>

            {selectedSuggestion.description && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Description</h4>
                <p className="text-gray-700">{selectedSuggestion.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Category</h4>
                <p className="text-gray-700">{selectedSuggestion.category}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Confidence</h4>
                <p className="text-blue-600 font-semibold">
                  {(selectedSuggestion.confidenceScore * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {selectedSuggestion.outcomes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Outcomes</h4>
                <div className="space-y-2">
                  {(Array.isArray(selectedSuggestion.outcomes) ? selectedSuggestion.outcomes : []).map((outcome: string, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      {outcome}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="success"
                onClick={() => {
                  handleApprove(selectedSuggestion.id);
                  setShowPreviewModal(false);
                }}
                className="flex-1"
              >
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handleReject(selectedSuggestion.id);
                  setShowPreviewModal(false);
                }}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default function AISuggestionsPage() {
  return (
    <AdminProtectedRoute>
      <AISuggestionsContent />
    </AdminProtectedRoute>
  );
}
