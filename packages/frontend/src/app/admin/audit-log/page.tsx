'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  admin: { id: string; displayName: string };
}

const ACTION_COLORS: Record<string, string> = {
  BET_CREATED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  BET_UPDATED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  BET_STATUS_CHANGED: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  BET_RESOLVED: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  USER_SUSPENDED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  USER_UNSUSPENDED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  AI_SUGGESTION_APPROVED: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  AI_SUGGESTION_REJECTED: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  AI_AGENT_EXECUTED: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  REPORT_RESOLVED: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
};

const ACTION_ICONS: Record<string, string> = {
  BET_CREATED: '🆕',
  BET_UPDATED: '✏️',
  BET_STATUS_CHANGED: '🔄',
  BET_RESOLVED: '✅',
  USER_SUSPENDED: '🚫',
  USER_UNSUSPENDED: '🔓',
  AI_SUGGESTION_APPROVED: '👍',
  AI_SUGGESTION_REJECTED: '👎',
  AI_AGENT_EXECUTED: '🤖',
  REPORT_RESOLVED: '📋',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [pagination, setPagination] = useState({ cursor: null as string | null, hasMore: false });
  const { admin } = useAuth();

  const fetchLogs = useCallback(async (cursor?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entityType', entityFilter);
      if (cursor) params.append('cursor', cursor);
      params.append('limit', '50');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/audit-log?${params.toString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch audit log');
      const data = await response.json();

      if (cursor) {
        setLogs(prev => [...prev, ...data.data]);
      } else {
        setLogs(data.data);
      }
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter]);

  useEffect(() => {
    if (admin) fetchLogs();
  }, [admin, fetchLogs]);

  const formatAction = (action: string) => action.replace(/_/g, ' ');

  const formatMetadata = (meta: any) => {
    if (!meta) return '';
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch { return meta; }
    }
    return Object.entries(meta)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' · ');
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Audit Log"
        subtitle="Track all administrative actions"
      />

      <div className="p-6 md:p-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                <option value="BET_CREATED">Bet Created</option>
                <option value="BET_UPDATED">Bet Updated</option>
                <option value="BET_STATUS_CHANGED">Status Changed</option>
                <option value="BET_RESOLVED">Bet Resolved</option>
                <option value="USER_SUSPENDED">User Suspended</option>
                <option value="USER_UNSUSPENDED">User Unsuspended</option>
                <option value="AI_SUGGESTION_APPROVED">AI Approved</option>
                <option value="AI_SUGGESTION_REJECTED">AI Rejected</option>
                <option value="AI_AGENT_EXECUTED">AI Agent Executed</option>
                <option value="REPORT_RESOLVED">Report Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Entity</label>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Entities</option>
                <option value="BET">Bets</option>
                <option value="USER">Users</option>
                <option value="AI_SUGGESTION">AI Suggestions</option>
                <option value="REPORT">Reports</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
            {(actionFilter || entityFilter) && (
              <button
                onClick={() => { setActionFilter(''); setEntityFilter(''); }}
                className="text-sm text-blue-600 hover:text-blue-800 mt-5"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && logs.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-200 border-t-blue-600"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        {/* Empty */}
        {!loading && logs.length === 0 && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center py-16 text-center transition-colors duration-300">
            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No audit logs</h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm">No audit log entries match the current filters.</p>
          </div>
        )}

        {/* Audit Log Timeline */}
        {logs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{ACTION_ICONS[log.action] || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {formatAction(log.action)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {log.entityType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {formatMetadata(log.metadata)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                        <span>by <strong className="text-gray-600 dark:text-gray-300">{log.admin?.displayName || 'System'}</strong></span>
                        <span>·</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                        <span className="text-gray-300 font-mono text-[10px] hidden sm:inline">
                          {log.entityId?.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Load More */}
        {pagination.hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => pagination.cursor && fetchLogs(pagination.cursor)}
              disabled={loading}
              className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
