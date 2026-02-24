'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, X, ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Card, CardContent } from "@/components/ui/Card";

const PAGE_SIZE = 10;

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  clientType?: 'NEW' | 'REPEAT';
  isVIP?: boolean;
  totalBookings: number;
  completedBookings: number;
  totalSpent: number;
  totalTips: number;
  totalDiscounts: number;
  lastVisit?: string | null;
  isActive?: boolean;
  totalVisits: number;
  hasNotes: boolean;
}

interface ApiCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  clientType?: 'NEW' | 'REPEAT';
  isVIP?: boolean;
  totalBookings?: number;
  completedBookings?: number;
  totalSpent?: number;
  totalTips?: number;
  totalDiscounts?: number;
  lastVisit?: string | null;
  isActive?: boolean;
  totalVisits: number;
}

function mapApiToClient(c: ApiCustomer): Client {
  return {
    id: c.id,
    name: c.name,
    email: c.email ?? '',
    phone: c.phone ?? '',
    clientType: c.clientType,
    isVIP: c.isVIP ?? false,
    totalBookings: c.totalBookings ?? 0,
    completedBookings: c.completedBookings ?? 0,
    totalSpent: c.totalSpent ?? 0,
    totalTips: c.totalTips ?? 0,
    totalDiscounts: c.totalDiscounts ?? 0,
    lastVisit: c.lastVisit ?? null,
    isActive: c.isActive ?? true,
    totalVisits: c.totalVisits ?? 0,
    hasNotes: !!(c.notes && c.notes.trim()),
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientModalMode, setClientModalMode] = useState<'view' | 'edit'>('view');
  const [clientDetails, setClientDetails] = useState<any | null>(null);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);
  const [clientDetailsError, setClientDetailsError] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; email: string; phone: string; socialMediaName: string; notes: string; isVIP: boolean }>({ name: '', email: '', phone: '', socialMediaName: '', notes: '', isVIP: false });
  const [savingClient, setSavingClient] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [addClientDraft, setAddClientDraft] = useState({ name: '', email: '', phone: '', socialMediaName: '', notes: '', isVIP: false });
  const [addingClient, setAddingClient] = useState(false);

  const handleViewClient = useCallback(async (clientId: string, mode: 'view' | 'edit' = 'view') => {
    try {
      setClientDetailsLoading(true);
      setClientDetailsError(null);
      setClientModalMode(mode);
      setShowClientModal(true);

      const response = await fetch(`/api/customers/${clientId}`);
      if (!response.ok) throw new Error('Failed to load client details');
      const data = await response.json();
      setClientDetails(data);
      const c = data?.customer;
      if (c) {
        setEditDraft({
          name: c.name ?? '',
          email: c.email ?? '',
          phone: c.phone ?? '',
          socialMediaName: c.socialMediaName ?? '',
          notes: c.notes ?? '',
          isVIP: c.isVIP ?? false,
        });
      }
    } catch (err: any) {
      setClientDetailsError(err.message || 'Failed to load client details');
    } finally {
      setClientDetailsLoading(false);
    }
  }, []);

  const handleAddClient = async () => {
    if (!addClientDraft.name.trim()) return;
    try {
      setAddingClient(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addClientDraft.name.trim(),
          email: addClientDraft.email.trim() || undefined,
          phone: addClientDraft.phone.trim() || undefined,
          socialMediaName: addClientDraft.socialMediaName.trim() || undefined,
          notes: addClientDraft.notes.trim() || undefined,
          isVIP: addClientDraft.isVIP,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add client');
      }
      toast.success('Client added successfully');
      setShowAddClientModal(false);
      setAddClientDraft({ name: '', email: '', phone: '', socialMediaName: '', notes: '', isVIP: false });
      await fetchClients();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add client');
    } finally {
      setAddingClient(false);
    }
  };

  const handleSaveClient = async () => {
    const customerId = clientDetails?.customer?.id;
    if (!customerId) return;
    try {
      setSavingClient(true);
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDraft.name.trim(),
          email: editDraft.email.trim() || undefined,
          phone: editDraft.phone.trim() || undefined,
          socialMediaName: editDraft.socialMediaName.trim() || undefined,
          notes: editDraft.notes.trim() || undefined,
          isVIP: editDraft.isVIP,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update client');
      }
      const data = await res.json();
      setClientDetails({ customer: data.customer });
      setClientModalMode('view');
      toast.success('Client updated successfully');
      await fetchClients();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update client');
    } finally {
      setSavingClient(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('customerId');
    if (clientId) {
      handleViewClient(clientId);
    }
  }, [handleViewClient]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    try {
      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error(res.statusText || 'Failed to fetch clients');
      const data = await res.json();
      setClients((data.customers ?? []).map(mapApiToClient));
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return clients.slice(start, start + PAGE_SIZE);
  }, [clients, currentPage]);

  const totalItems = clients.length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Filter Card */}
      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="h-9 px-3 text-sm rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all flex items-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            <button
              onClick={() => setShowAddClientModal(true)}
              className="h-9 px-4 text-sm font-medium rounded-lg bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-colors flex items-center justify-center gap-2 ml-auto"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0f0f0]" style={{ background: 'linear-gradient(to right, #fafafa, #f5f5f5)' }}>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Client Name</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Contact</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Total Visits</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Tag</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Notes</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {loading ? (
                  <>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-5 py-3.5">
                            <div className="h-4 w-20 animate-pulse rounded bg-[#e5e5e5]" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <div className="h-12 w-12 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                          <Search className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                          {searchQuery.trim() ? 'No clients match your search.' : 'No clients yet.'}
                        </p>
                        <p className="text-xs text-gray-400 max-w-[240px]">
                          {searchQuery.trim() ? 'Try adjusting your search or clearing the search box.' : 'Clients are added when you create bookings, or you can add one manually.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors duration-100 group">
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-[#1a1a1a]">{item.name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-[#1a1a1a]">{item.email || '—'}</span>
                          <span className="text-xs text-gray-400 mt-0.5">{item.phone || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#1a1a1a] tabular-nums">{item.totalVisits}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1">
                          {item.isVIP ? (
                            <Badge variant="vip">VIP</Badge>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">Regular</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {item.hasNotes ? (
                          <div className="h-6 w-6 rounded-full bg-[#f5f5f5] flex items-center justify-center" title="Has notes">
                            <FileText className="h-3.5 w-3.5 text-gray-400" />
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewClient(item.id, 'view')}
                            className="h-7 px-2.5 text-xs rounded-md border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleViewClient(item.id, 'edit')}
                            className="h-7 px-2.5 text-xs rounded-md border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => router.push(`/admin/bookings?customerId=${item.id}`)}
                            className="h-7 px-2.5 text-xs rounded-md border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                          >
                            Bookings
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden p-4 space-y-3">
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm space-y-3">
                    <div className="flex justify-between">
                      <div className="h-5 w-32 animate-pulse rounded bg-[#e5e5e5]" />
                      <div className="h-6 w-16 animate-pulse rounded-full bg-[#e5e5e5]" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-4 w-48 animate-pulse rounded bg-[#e5e5e5]" />
                      <div className="h-4 w-36 animate-pulse rounded bg-[#e5e5e5]" />
                    </div>
                    <div className="flex gap-2">
                      <button className="h-7 w-14 animate-pulse rounded bg-[#e5e5e5]" />
                      <button className="h-7 w-14 animate-pulse rounded bg-[#e5e5e5]" />
                    </div>
                  </div>
                ))}
              </>
            ) : paginatedClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                  <Search className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {searchQuery.trim() ? 'No clients match your search.' : 'No clients yet.'}
                </p>
                <p className="text-xs text-gray-400 max-w-[240px]">
                  {searchQuery.trim() ? 'Try adjusting your search or clearing the search box.' : 'Clients are added when you create bookings, or you can add one manually.'}
                </p>
              </div>
            ) : (
              paginatedClients.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-[#1a1a1a]">{item.name}</p>
                    {item.isVIP ? (
                      <Badge variant="vip">VIP</Badge>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">Regular</span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    {item.email && <p className="text-gray-600">{item.email}</p>}
                    {item.phone && <p className="text-gray-500 text-xs">{item.phone}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{item.totalVisits} visits</span>
                    {item.hasNotes && <FileText className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={() => handleViewClient(item.id, 'view')}
                      className="w-full h-10 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-sm font-medium text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa] transition-all"
                    >
                      View
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewClient(item.id, 'edit')}
                        className="flex-1 h-10 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-sm font-medium text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => router.push(`/admin/bookings?customerId=${item.id}`)}
                        className="flex-1 h-10 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-sm font-medium text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                      >
                        Bookings
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          <p className="text-xs text-gray-400 order-2 sm:order-1">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalItems)} of {totalItems}
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
                      className={`h-9 w-9 flex items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                        currentPage === page ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-sm' : 'border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
                      }`}
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

      <Dialog open={showClientModal} onOpenChange={(open) => { if (!open) { setShowClientModal(false); setClientModalMode('view'); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{clientModalMode === 'edit' ? 'Edit Client' : 'Client Details'}</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4" style={{ fontSize: '0.92rem' }}>
            {clientDetailsLoading ? (
              <div className="text-gray-600">Loading client details...</div>
            ) : clientDetailsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {clientDetailsError}
              </div>
            ) : clientDetails?.customer ? (
              <>
                {clientModalMode === 'edit' ? (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Name</label>
                        <Input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                          className="h-9"
                          placeholder="Client name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                        <Input
                          type="email"
                          value={editDraft.email}
                          onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value }))}
                          className="h-9"
                          placeholder="Email"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
                        <Input
                          value={editDraft.phone}
                          onChange={(e) => setEditDraft((d) => ({ ...d, phone: e.target.value }))}
                          className="h-9"
                          placeholder="Phone"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Social Media</label>
                        <Input
                          value={editDraft.socialMediaName}
                          onChange={(e) => setEditDraft((d) => ({ ...d, socialMediaName: e.target.value }))}
                          className="h-9"
                          placeholder="Social media name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Notes</label>
                        <textarea
                          value={editDraft.notes}
                          onChange={(e) => setEditDraft((d) => ({ ...d, notes: e.target.value }))}
                          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]"
                          placeholder="Notes"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Checkbox
                          id="edit-vip"
                          checked={editDraft.isVIP}
                          onCheckedChange={(checked) => setEditDraft((d) => ({ ...d, isVIP: !!checked }))}
                        />
                        <label htmlFor="edit-vip" className="text-sm font-medium text-[#1a1a1a] cursor-pointer">
                          VIP Client
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <div><strong>Name:</strong> {clientDetails.customer.name}</div>
                      {clientDetails.customer.email && <div><strong>Email:</strong> {clientDetails.customer.email}</div>}
                      {clientDetails.customer.phone && <div><strong>Phone:</strong> {clientDetails.customer.phone}</div>}
                      {clientDetails.customer.socialMediaName && (
                        <div><strong>Social:</strong> {clientDetails.customer.socialMediaName}</div>
                      )}
                      {clientDetails.customer.referralSource && (
                        <div><strong>Referral:</strong> {clientDetails.customer.referralSource}</div>
                      )}
                      {clientDetails.customer.referralSourceOther && (
                        <div><strong>Referral (Other):</strong> {clientDetails.customer.referralSourceOther}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                )}

                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3">
                      <span><strong>Total Bookings:</strong> {clientDetails.customer.totalBookings ?? 0}</span>
                      <span><strong>Completed:</strong> {clientDetails.customer.completedBookings ?? 0}</span>
                      <span><strong>Last Visit:</strong> {clientDetails.customer.lastVisit ? new Date(clientDetails.customer.lastVisit).toLocaleDateString('en-US') : '-'}</span>
                      <span><strong>Total Spent:</strong> PHP {(clientDetails.customer.totalSpent ?? 0).toLocaleString()}</span>
                      <span><strong>Total Tips:</strong> PHP {(clientDetails.customer.totalTips ?? 0).toLocaleString()}</span>
                      <span><strong>Total Discounts:</strong> PHP {(clientDetails.customer.totalDiscounts ?? 0).toLocaleString()}</span>
                      <span><strong>Client Type:</strong> {clientDetails.customer.clientType || 'NEW'}</span>
                      <span><strong>Status:</strong> {clientDetails.customer.isActive === false ? 'Inactive' : 'Active'}</span>
                      {clientDetails.customer.isVIP && (
                        <Badge variant="vip">VIP</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {(clientDetails.customer.nailHistory || clientDetails.customer.healthInfo) && (
                  <Card>
                    <CardContent className="p-4">
                      {clientDetails.customer.nailHistory && (
                        <div className="mb-2">
                          <div className="font-semibold">Nail History</div>
                          <div className="text-gray-600 text-sm">
                            Russian Manicure: {clientDetails.customer.nailHistory.hasRussianManicure ? 'Yes' : 'No'} | 
                            Gel Overlay: {clientDetails.customer.nailHistory.hasGelOverlay ? 'Yes' : 'No'} | 
                            Softgel Extensions: {clientDetails.customer.nailHistory.hasSoftgelExtensions ? 'Yes' : 'No'}
                          </div>
                        </div>
                      )}
                      {clientDetails.customer.healthInfo && (
                        <div>
                          <div className="font-semibold">Health Info</div>
                          {clientDetails.customer.healthInfo.allergies && (
                            <div className="text-gray-600 text-sm">Allergies: {clientDetails.customer.healthInfo.allergies}</div>
                          )}
                          {clientDetails.customer.healthInfo.nailConcerns && (
                            <div className="text-gray-600 text-sm">Nail Concerns: {clientDetails.customer.healthInfo.nailConcerns}</div>
                          )}
                          {clientDetails.customer.healthInfo.nailDamageHistory && (
                            <div className="text-gray-600 text-sm">Damage History: {clientDetails.customer.healthInfo.nailDamageHistory}</div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {clientDetails.customer.inspoDescription && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="font-semibold">Inspiration Description</div>
                      <div className="text-gray-600 text-sm">{clientDetails.customer.inspoDescription}</div>
                    </CardContent>
                  </Card>
                )}

                {clientDetails.customer.notes && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="font-semibold">Notes</div>
                      <div className="text-gray-600 text-sm">{clientDetails.customer.notes}</div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-gray-600">No client details available.</div>
            )}
          </div>

          <DialogFooter>
            {clientModalMode === 'edit' ? (
              <>
                <Button type="button" variant="secondary" onClick={() => setClientModalMode('view')} disabled={savingClient}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveClient} disabled={savingClient || !editDraft.name.trim()}>
                  {savingClient ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button type="button" variant="secondary" onClick={() => setShowClientModal(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={showAddClientModal} onOpenChange={(open) => !open && setShowAddClientModal(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Name <span className="text-red-500">*</span></label>
              <Input
                value={addClientDraft.name}
                onChange={(e) => setAddClientDraft((d) => ({ ...d, name: e.target.value }))}
                className="h-9"
                placeholder="Client name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
              <Input
                type="email"
                value={addClientDraft.email}
                onChange={(e) => setAddClientDraft((d) => ({ ...d, email: e.target.value }))}
                className="h-9"
                placeholder="Email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
              <Input
                value={addClientDraft.phone}
                onChange={(e) => setAddClientDraft((d) => ({ ...d, phone: e.target.value }))}
                className="h-9"
                placeholder="Phone"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Social Media</label>
              <Input
                value={addClientDraft.socialMediaName}
                onChange={(e) => setAddClientDraft((d) => ({ ...d, socialMediaName: e.target.value }))}
                className="h-9"
                placeholder="Social media name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Notes</label>
              <textarea
                value={addClientDraft.notes}
                onChange={(e) => setAddClientDraft((d) => ({ ...d, notes: e.target.value }))}
                className="w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]"
                placeholder="Notes"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="add-vip"
                checked={addClientDraft.isVIP}
                onCheckedChange={(checked) => setAddClientDraft((d) => ({ ...d, isVIP: !!checked }))}
              />
              <label htmlFor="add-vip" className="text-sm font-medium text-[#1a1a1a] cursor-pointer">
                VIP Client
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAddClientModal(false)} disabled={addingClient}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddClient} disabled={addingClient || !addClientDraft.name.trim()}>
              {addingClient ? 'Adding...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


