'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { displayName: string; avatarUrl: string | null };
  replies: Comment[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function useComments(betId: string) {
  return useQuery<Comment[]>({
    queryKey: ['comments', betId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/bets/${betId}/comments`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      return data.data;
    },
    staleTime: 15000,
  });
}

function usePostComment(betId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const res = await fetch(`${API_URL}/api/bets/${betId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, parentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to post comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', betId] });
    },
  });
}

function CommentItem({
  comment,
  betId,
  depth = 0,
}: {
  comment: Comment;
  betId: string;
  depth?: number;
}) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const postComment = usePostComment(betId);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await postComment.mutateAsync({ content: replyText, parentId: comment.id });
      setReplyText('');
      setShowReply(false);
      toast.success('Reply posted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 dark:border-gray-700 pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        {comment.user.avatarUrl ? (
          <img src={comment.user.avatarUrl} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
            {comment.user.displayName?.charAt(0) || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.user.displayName}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          {user && depth === 0 && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-xs text-gray-400 hover:text-blue-600 mt-1 font-medium"
            >
              Reply
            </button>
          )}

          {showReply && (
            <div className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                placeholder="Write a reply..."
                maxLength={500}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || postComment.isPending}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {postComment.isPending ? '...' : 'Reply'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} betId={betId} depth={depth + 1} />
      ))}
    </div>
  );
}

export function CommentsSection({ betId }: { betId: string }) {
  const { user } = useAuth();
  const { data: comments, isLoading } = useComments(betId);
  const postComment = usePostComment(betId);
  const [newComment, setNewComment] = useState('');

  const handlePost = async () => {
    if (!newComment.trim()) return;
    try {
      await postComment.mutateAsync({ content: newComment });
      setNewComment('');
      toast.success('Comment posted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Discussion
        </h3>
        {comments && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{comments.length} comments</span>
        )}
      </div>

      {/* New Comment Input */}
      {user ? (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
              {user.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts on this market..."
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">{newComment.length}/500</span>
                <button
                  onClick={handlePost}
                  disabled={!newComment.trim() || postComment.isPending}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {postComment.isPending ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 text-center text-sm text-gray-400 dark:text-gray-500">
          Sign in to join the discussion
        </div>
      )}

      {/* Comments List */}
      <div className="px-5">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : !comments || comments.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No comments yet. Be the first to share your analysis!
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} betId={betId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
