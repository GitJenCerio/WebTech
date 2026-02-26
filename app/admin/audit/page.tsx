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

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Signed in',
  LOGOUT: 'Signed out',
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  CONFIRM: 'Confirmed',
};

const RESOURCE_LABELS: Record<string, string> = {
  Booking: 'appointment',
  Customer: 'client',
  User: 'user account',
  Slot: 'time slot',
  NailTech: 'nail technician',
};

function getActivityDescription(entry: AuditEntry): string {
  const actionLabel = ACTION_LABELS[entry.action] || entry.action;
  const resourceLabel = RESOURCE_LABELS[entry.resource] || entry.resource.toLowerCase();
  const d = entry.details || {};

  if (entry.action === 'LOGIN') return 'Signed in to the admin panel';
  if (entry.action === 'LOGOUT') return 'Signed out';

  const withWhat = (verb: string, thing: string) => {
    const parts: string[] = [];
    if (typeof d.customerName === 'string') parts.push(`client "${d.customerName}"`);
    if (typeof d.clientName === 'string') parts.push(`client "${d.clientName}"`);
    if (typeof d.name === 'string') parts.push(`"${d.name}"`);
    if (typeof d.email === 'string') parts.push(d.email);
    if (typeof d.appointmentDate === 'string') parts.push(`on ${new Date(d.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
    if (typeof d.date === 'string') parts.push(`on ${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
    if (typeof d.bookingCode === 'string') parts.push(`(booking ${d.bookingCode})`);
    const suffix = parts.length > 0 ? `: ${parts.join(', ')}` : '';
    return `${verb} ${thing}${suffix}`;
  };

  if (entry.action === 'CREATE') return withWhat('Created', resourceLabel);
  if (entry.action === 'UPDATE') return withWhat('Updated', resourceLabel);
  if (entry.action === 'DELETE') return withWhat('Removed', resourceLabel);
  if (entry.action === 'CONFIRM') return withWhat('Confirmed', resourceLabel);

  return `${actionLabel} ${resourceLabel}`;
}

function formatDetailsForDisplay(details: Record<string, unknown> | undefined): string {
  if (!details || Object.keys(details).length === 0) return '—';
  const keyLabels: Record<string, string> = {
    customerName: 'Client',
    clientName: 'Client',
    name: 'Name',
    email: 'Email',
    appointmentDate: 'Appointment date',
    date: 'Date',
    bookingCode: 'Booking code',
    service: 'Service',
    status: 'Status',
    time: 'Time',
  };
  const parts = Object.entries(details)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => {
      const label = keyLabels[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
      const val = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : String(v);
      return `${label}: ${val}`;
    });
  return parts.join(' · ') || '—';
}

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

      const res = await fetch(`/api/audit?${params.toString()}`);
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
        <p className="text-sm text-gray-500 mt-0.5">Who did what and when</p>
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
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Activity</th>
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
                        <td className="px-5 py-3 text-[#1a1a1a]">
                          {getActivityDescription(entry)}
                        </td>
                        <td className="px-5 py-3 text-gray-600 text-sm max-w-[280px]">
                          {formatDetailsForDisplay(entry.details)}
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
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-[#1a1a1a]">{entry.userName || entry.userEmail || '—'}</span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                      </span>
                    </div>
                    <p className="text-sm text-[#1a1a1a]">{getActivityDescription(entry)}</p>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <p className="text-xs text-gray-600">{formatDetailsForDisplay(entry.details)}</p>
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
