'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

interface AuditEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  createdAt: string | null;
}

const ACTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'CONFIRM', label: 'Confirm' },
];

const RESOURCES = [
  { value: 'all', label: 'All resources' },
  { value: 'Booking', label: 'Booking' },
  { value: 'Customer', label: 'Customer' },
  { value: 'User', label: 'User' },
  { value: 'Slot', label: 'Slot' },
  { value: 'NailTech', label: 'Nail Tech' },
];

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('skip', String((currentPage - 1) * PAGE_SIZE));
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (resourceFilter !== 'all') params.set('resource', resourceFilter);

      const res = await fetch(`/api/audit-log?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, actionFilter, resourceFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1a1a1a]">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track system activity and changes</p>
      </div>

      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-2 py-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex gap-4 py-3 border-b border-[#f0f0f0] animate-pulse">
                    <div className="h-4 w-24 rounded bg-[#e5e5e5]" />
                    <div className="h-4 w-20 rounded bg-[#e5e5e5]" />
                    <div className="h-4 w-32 rounded bg-[#e5e5e5]" />
                    <div className="h-4 flex-1 rounded bg-[#e5e5e5]" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                <div className="h-10 w-10 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                  <Search className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">No audit entries found</span>
                <span className="text-xs">Activity will appear here as actions are performed</span>
              </div>
            ) : (
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f0f0f0]" style={{ background: 'linear-gradient(to right, #fafafa, #f5f5f5)' }}>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Resource</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f5]">
                    {items.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#fafafa]">
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-medium text-[#1a1a1a]">{entry.userName || entry.userEmail || '—'}</span>
                          {entry.userEmail && entry.userName && (
                            <p className="text-xs text-gray-400">{entry.userEmail}</p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#f0f0f0] text-[#1a1a1a]">
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[#1a1a1a]">
                          {entry.resource}
                          {entry.resourceId && (
                            <span className="text-gray-400 ml-1">({entry.resourceId.slice(-8)})</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-500 max-w-[200px] truncate">
                          {entry.details && Object.keys(entry.details).length > 0
                            ? JSON.stringify(entry.details).slice(0, 80) + (JSON.stringify(entry.details).length > 80 ? '…' : '')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile card view */}
            <div className="sm:hidden space-y-3 mt-4">
              {!loading &&
                items.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-[#1a1a1a]">{entry.userName || entry.userEmail || '—'}</span>
                      <span className="text-xs text-gray-500">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#f0f0f0]">
                        {entry.action}
                      </span>
                      <span className="text-sm text-gray-600">{entry.resource}</span>
                    </div>
                    {entry.resourceId && (
                      <p className="text-xs text-gray-400">ID: {entry.resourceId}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {!loading && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#f0f0f0] mt-4">
              <p className="text-xs text-gray-400 order-2 sm:order-1">
                Showing {startItem}–{endItem} of {total}
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end order-1 sm:order-2">
                <span className="sm:hidden text-xs text-gray-500">Page {currentPage} / {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-9 min-w-[44px] flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-9 w-9 flex items-center justify-center rounded-lg border text-xs font-medium transition-all ${currentPage === page ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-sm' : 'border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9 min-w-[44px] flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
