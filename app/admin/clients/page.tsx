'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, X, ChevronLeft, ChevronRight, FileText, Plus, Ban } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useSession } from 'next-auth/react';
import { canManageCustomers } from '@/lib/rbac';
import BanClientDialog from '@/components/admin/BanClientDialog';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { PageHeader } from '@/components/admin/PageHeader';
import { formatSocialMediaDisplay } from '@/lib/utils/socialMedia';

const PAGE_SIZE = 20;

const textActionClass =
  'h-8 px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] border border-[#e7e2db] bg-[#fffcfa] text-[#57534e] hover:border-[#1c1917] hover:bg-[#1c1917] hover:text-[#fffcfa] transition-all';
const pagerClass =
  'h-9 min-w-[44px] flex items-center justify-center border border-[#e7e2db] bg-[#fffcfa] text-[#78716c] hover:border-[#1c1917] hover:text-[#1c1917] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm px-2';

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
  socialMediaName?: string;
}

interface IdentifierBan {
  id: string;
  customerId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  socialMediaName: string | null;
  reason: string | null;
}

interface ApiCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  socialMediaName?: string;
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

function ClientTags({ item }: { item: Client }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {item.isActive === false && <Badge variant="destructive">Banned</Badge>}
      {item.isVIP ? (
        <Badge variant="vip">VIP</Badge>
      ) : item.isActive !== false ? (
        <Badge variant="regular">Regular</Badge>
      ) : null}
    </div>
  );
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
    socialMediaName: c.socialMediaName ?? '',
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const canBan = canManageCustomers({
    role: (session?.user as { role?: string } | undefined)?.role,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'banned'>('all');
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
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banDialogMode, setBanDialogMode] = useState<'customer' | 'identifiers'>('customer');
  const [banTarget, setBanTarget] = useState<{ id: string; name?: string; email?: string; phone?: string; socialMediaName?: string } | null>(null);
  const [unbanTarget, setUnbanTarget] = useState<Client | null>(null);
  const [unbanning, setUnbanning] = useState(false);
  const [identifierBans, setIdentifierBans] = useState<IdentifierBan[]>([]);
  const [unbanIdentifierId, setUnbanIdentifierId] = useState<string | null>(null);

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

  const handleUnbanClient = async () => {
    if (!unbanTarget) return;
    try {
      setUnbanning(true);
      const res = await fetch(`/api/customers/${unbanTarget.id}/ban`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to unban client');
      toast.success('Client unbanned');
      setUnbanTarget(null);
      if (clientDetails?.customer?.id === unbanTarget.id) {
        setClientDetails({
          ...clientDetails,
          customer: { ...clientDetails.customer, isActive: true, bannedAt: null, bannedReason: undefined },
        });
      }
      await fetchClients();
    } catch (err: any) {
      toast.error(err.message || 'Failed to unban client');
    } finally {
      setUnbanning(false);
    }
  };

  const handleUnbanIdentifier = async () => {
    if (!unbanIdentifierId) return;
    try {
      setUnbanning(true);
      const res = await fetch(`/api/banned-clients/${unbanIdentifierId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to remove ban');
      toast.success('Ban removed');
      setUnbanIdentifierId(null);
      await fetchClients();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove ban');
    } finally {
      setUnbanning(false);
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
    if (statusFilter === 'banned') params.set('status', 'banned');
    try {
      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error(res.statusText || 'Failed to fetch clients');
      const data = await res.json();
      setClients((data.customers ?? []).map(mapApiToClient));
      setCurrentPage(1);
      if (canBan) {
        const bansRes = await fetch('/api/banned-clients');
        if (bansRes.ok) {
          const bansData = await bansRes.json();
          setIdentifierBans((bansData.bans ?? []).filter((b: IdentifierBan) => !b.customerId));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, canBan]);

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
    <div className="space-y-4 md:space-y-5">
      <PageHeader
        title="Clients"
        description="Select a client to view details and manage their record."
      />

      {error && (
        <div className="brand-note-error text-sm" role="alert">
          {error}
        </div>
      )}

      <div className="brand-panel p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c4b5a0] pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="brand-field pl-9 h-10"
              />
            </div>
            {searchQuery && (
              <Button type="button" variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
            )}
            <div className="flex items-center border border-[#e7e2db] bg-[#f7f6f4]">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`h-10 px-4 text-[10px] uppercase tracking-[0.14em] transition-all ${
                  statusFilter === 'all' ? 'bg-[#1c1917] text-[#fffcfa]' : 'text-[#78716c] hover:text-[#1c1917] hover:bg-[#f0ebe4]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('banned')}
                className={`h-10 px-4 text-[10px] uppercase tracking-[0.14em] transition-all ${
                  statusFilter === 'banned' ? 'bg-[#1c1917] text-[#fffcfa]' : 'text-[#78716c] hover:text-[#1c1917] hover:bg-[#f0ebe4]'
                }`}
              >
                Banned
              </button>
            </div>
            {canBan && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setBanTarget(null);
                  setBanDialogMode('identifiers');
                  setBanDialogOpen(true);
                }}
              >
                <Ban className="h-3.5 w-3.5 mr-1.5" />
                Ban details
              </Button>
            )}
            <Button type="button" size="sm" className="sm:ml-auto" onClick={() => setShowAddClientModal(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Client
            </Button>
          </div>
      </div>

      <div className="brand-panel overflow-hidden">
          {loading ? (
            <>
              <div className="hidden md:block">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[1.4fr_1.6fr_5.5rem_7rem_3.5rem] gap-4 px-5 py-3 border-b border-[#f0ebe4]">
                    <div className="h-4 w-40 animate-pulse bg-[#e7e2db]" />
                    <div className="h-4 w-52 animate-pulse bg-[#e7e2db]" />
                    <div className="h-4 w-10 animate-pulse bg-[#e7e2db]" />
                    <div className="h-4 w-16 animate-pulse bg-[#e7e2db]" />
                    <div className="h-4 w-6 animate-pulse bg-[#e7e2db]" />
                  </div>
                ))}
              </div>
              <div className="md:hidden divide-y divide-[#f0ebe4]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-3 space-y-2">
                    <div className="h-5 w-36 animate-pulse bg-[#e7e2db]" />
                    <div className="h-4 w-48 animate-pulse bg-[#e7e2db]" />
                    <div className="h-4 w-24 animate-pulse bg-[#e7e2db]" />
                  </div>
                ))}
              </div>
            </>
          ) : paginatedClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                <div className="h-12 w-12 bg-[#f0ebe4] flex items-center justify-center">
                  <Search className="h-6 w-6 text-[#c4b5a0]" />
                </div>
                <p className="font-heading text-lg text-[#1c1917]">
                  {searchQuery.trim()
                    ? 'No clients match your search.'
                    : statusFilter === 'banned'
                      ? 'No banned clients.'
                      : 'No clients yet.'}
                </p>
                <p className="text-xs text-[#78716c] max-w-[240px]">
                  {searchQuery.trim()
                    ? 'Try adjusting your search or clearing the search box.'
                    : statusFilter === 'banned'
                      ? 'Banned clients appear here. You can also ban by name, email, phone, or social details.'
                      : 'Clients are added when you create bookings, or you can add one manually.'}
                </p>
              </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-[#e7e2db] bg-[#f7f6f4]">
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[#78716c] uppercase tracking-[0.12em] whitespace-nowrap">Client</th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[#78716c] uppercase tracking-[0.12em] whitespace-nowrap">Contact</th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[#78716c] uppercase tracking-[0.12em] whitespace-nowrap">Visits</th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[#78716c] uppercase tracking-[0.12em] whitespace-nowrap">Tag</th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[#78716c] uppercase tracking-[0.12em] whitespace-nowrap">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ebe4]">
                    {paginatedClients.map((item) => (
                      <tr
                        key={item.id}
                        tabIndex={0}
                        onClick={() => handleViewClient(item.id, 'view')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleViewClient(item.id, 'view');
                          }
                        }}
                        className="cursor-pointer hover:bg-[#f7f6f4] focus-visible:outline-none focus-visible:bg-[#f7f6f4] transition-colors duration-100"
                      >
                        <td className="px-5 py-2.5 align-middle">
                          <span className="block font-medium text-[#1c1917] truncate">{item.name}</span>
                        </td>
                        <td className="px-5 py-2.5 align-middle min-w-0">
                          <span className="block text-[#3d342c] truncate">{item.email || '—'}</span>
                          <span className="block text-xs text-[#78716c] truncate">{item.phone || '—'}</span>
                        </td>
                        <td className="px-5 py-2.5 align-middle font-medium text-[#1c1917] brand-numeric">{item.totalVisits}</td>
                        <td className="px-5 py-2.5 align-middle">
                          <ClientTags item={item} />
                        </td>
                        <td className="px-5 py-2.5 align-middle">
                          {item.hasNotes ? (
                            <span title="Has notes" className="inline-flex h-6 w-6 items-center justify-center bg-[#f0ebe4]">
                              <FileText className="h-3.5 w-3.5 text-[#c4b5a0]" />
                            </span>
                          ) : (
                            <span className="text-[#c4b5a0]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-[#f0ebe4]">
                {paginatedClients.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleViewClient(item.id, 'view')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleViewClient(item.id, 'view');
                      }
                    }}
                    className="w-full text-left p-3 cursor-pointer hover:bg-[#f7f6f4] focus-visible:outline-none focus-visible:bg-[#f7f6f4] transition-colors duration-100"
                  >
                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        <span className="block font-heading text-lg text-[#1c1917] break-words leading-tight">{item.name}</span>
                        <ClientTags item={item} />
                      </div>
                      <div className="space-y-0.5 text-sm">
                        <span className="block text-[#3d342c] break-words">{item.email || '—'}</span>
                        <span className="block text-xs text-[#78716c]">{item.phone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#78716c]">
                        <span className="brand-numeric">{item.totalVisits} visits</span>
                        {item.hasNotes && (
                          <span title="Has notes" className="inline-flex h-5 w-5 items-center justify-center bg-[#f0ebe4]">
                            <FileText className="h-3 w-3 text-[#c4b5a0]" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          <p className="text-xs text-[#78716c] order-2 sm:order-1">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end order-1 sm:order-2">
            <span className="sm:hidden text-xs text-[#78716c]">Page {currentPage} / {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={pagerClass}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      type="button"
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-9 w-9 flex items-center justify-center border text-[10px] uppercase tracking-[0.08em] font-medium transition-all ${
                        currentPage === page
                          ? 'bg-[#1c1917] border-[#1c1917] text-[#fffcfa]'
                          : 'border-[#e7e2db] bg-[#fffcfa] text-[#78716c] hover:border-[#1c1917] hover:text-[#1c1917]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={pagerClass}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showClientModal} onOpenChange={(open) => { if (!open) { setShowClientModal(false); setClientModalMode('view'); } }}>
        <DialogContent className="max-w-[min(100%,40rem)] sm:max-w-2xl flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{clientModalMode === 'edit' ? 'Edit Client' : 'Client Details'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-4 overscroll-contain">
            {clientDetailsLoading ? (
              <div className="text-sm text-[#78716c]">Loading client details...</div>
            ) : clientDetailsError ? (
              <div className="brand-note-error text-sm" role="alert">
                {clientDetailsError}
              </div>
            ) : clientDetails?.customer ? (
              <>
                {clientModalMode === 'edit' ? (
                  <div className="brand-panel-soft p-4 space-y-3">
                      <div>
                        <label>Name</label>
                        <Input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                          className="h-10"
                          placeholder="Client name"
                        />
                      </div>
                      <div>
                        <label>Email</label>
                        <Input
                          type="email"
                          value={editDraft.email}
                          onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value }))}
                          className="h-10"
                          placeholder="Email"
                        />
                      </div>
                      <div>
                        <label>Phone</label>
                        <Input
                          value={editDraft.phone}
                          onChange={(e) => setEditDraft((d) => ({ ...d, phone: e.target.value }))}
                          className="h-10"
                          placeholder="Phone"
                        />
                      </div>
                      <div>
                        <label>Social Media</label>
                        <Input
                          value={editDraft.socialMediaName}
                          onChange={(e) => setEditDraft((d) => ({ ...d, socialMediaName: e.target.value }))}
                          className="h-10"
                          placeholder="Social media name"
                        />
                      </div>
                      <div>
                        <label>Notes</label>
                        <textarea
                          value={editDraft.notes}
                          onChange={(e) => setEditDraft((d) => ({ ...d, notes: e.target.value }))}
                          className="brand-field min-h-[80px]"
                          placeholder="Notes"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Checkbox
                          id="edit-vip"
                          checked={editDraft.isVIP}
                          onCheckedChange={(checked) => setEditDraft((d) => ({ ...d, isVIP: !!checked }))}
                        />
                        <label htmlFor="edit-vip" className="label-inline">
                          VIP Client
                        </label>
                      </div>
                  </div>
                ) : (
                <div className="brand-panel-soft p-4 space-y-3">
                      <div>
                        <p className="brand-label">Name</p>
                        <p className="font-heading text-lg text-[#1c1917]">{clientDetails.customer.name}</p>
                      </div>
                      {clientDetails.customer.email && (
                        <div>
                          <p className="brand-label">Email</p>
                          <p className="text-sm text-[#3d342c]">{clientDetails.customer.email}</p>
                        </div>
                      )}
                      {clientDetails.customer.phone && (
                        <div>
                          <p className="brand-label">Phone</p>
                          <p className="text-sm text-[#3d342c]">{clientDetails.customer.phone}</p>
                        </div>
                      )}
                      {clientDetails.customer.socialMediaName && (
                        <div>
                          <p className="brand-label">Social</p>
                          <p className="text-sm text-[#3d342c]">
                            {formatSocialMediaDisplay(
                              clientDetails.customer.socialMediaName,
                              clientDetails.customer.socialMediaPlatform
                            )}
                          </p>
                        </div>
                      )}
                      {clientDetails.customer.referralSource && (
                        <div>
                          <p className="brand-label">Referral</p>
                          <p className="text-sm text-[#3d342c]">{clientDetails.customer.referralSource}</p>
                        </div>
                      )}
                      {clientDetails.customer.referralSourceOther && (
                        <div>
                          <p className="brand-label">Referral (Other)</p>
                          <p className="text-sm text-[#3d342c]">{clientDetails.customer.referralSourceOther}</p>
                        </div>
                      )}
                </div>
                )}

                <div className="brand-panel-soft p-4 space-y-3">
                    <p className="font-heading text-lg text-[#1c1917]">Visit summary</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="brand-label">Total bookings</p>
                        <p className="text-sm text-[#1c1917] brand-numeric">{clientDetails.customer.totalBookings ?? 0}</p>
                      </div>
                      <div>
                        <p className="brand-label">Completed</p>
                        <p className="text-sm text-[#1c1917] brand-numeric">{clientDetails.customer.completedBookings ?? 0}</p>
                      </div>
                      <div>
                        <p className="brand-label">Last visit</p>
                        <p className="text-sm text-[#1c1917]">
                          {clientDetails.customer.lastVisit
                            ? new Date(clientDetails.customer.lastVisit).toLocaleDateString('en-US')
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="brand-label">Total spent</p>
                        <p className="text-sm text-[#1c1917] brand-numeric">
                          PHP {(clientDetails.customer.totalSpent ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="brand-label">Total tips</p>
                        <p className="text-sm text-[#1c1917] brand-numeric">
                          PHP {(clientDetails.customer.totalTips ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="brand-label">Total discounts</p>
                        <p className="text-sm text-[#1c1917] brand-numeric">
                          PHP {(clientDetails.customer.totalDiscounts ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="brand-label">Client type</p>
                        <p className="text-sm text-[#1c1917]">{clientDetails.customer.clientType || 'NEW'}</p>
                      </div>
                      <div>
                        <p className="brand-label">Status</p>
                        <div className="flex flex-wrap items-center gap-1">
                          {clientDetails.customer.isActive === false ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                          {clientDetails.customer.isVIP && <Badge variant="vip">VIP</Badge>}
                        </div>
                      </div>
                    </div>
                    {clientDetails.customer.isActive === false && clientDetails.customer.bannedReason && (
                      <div>
                        <p className="brand-label">Ban reason</p>
                        <p className="text-sm text-[#5a3830]">{clientDetails.customer.bannedReason}</p>
                      </div>
                    )}
                </div>

                {(clientDetails.customer.nailHistory || clientDetails.customer.healthInfo) && (
                  <div className="brand-panel-soft p-4 space-y-3">
                      {clientDetails.customer.nailHistory && (
                        <div>
                          <p className="font-heading text-lg text-[#1c1917]">Nail history</p>
                          <p className="text-sm text-[#57534e]">
                            Russian Manicure: {clientDetails.customer.nailHistory.hasRussianManicure ? 'Yes' : 'No'}
                            {' · '}
                            Gel Overlay: {clientDetails.customer.nailHistory.hasGelOverlay ? 'Yes' : 'No'}
                            {' · '}
                            Softgel Extensions: {clientDetails.customer.nailHistory.hasSoftgelExtensions ? 'Yes' : 'No'}
                          </p>
                        </div>
                      )}
                      {clientDetails.customer.healthInfo && (
                        <div className="space-y-2">
                          <p className="font-heading text-lg text-[#1c1917]">Health info</p>
                          {clientDetails.customer.healthInfo.allergies && (
                            <div>
                              <p className="brand-label">Allergies</p>
                              <p className="text-sm text-[#57534e]">{clientDetails.customer.healthInfo.allergies}</p>
                            </div>
                          )}
                          {clientDetails.customer.healthInfo.nailConcerns && (
                            <div>
                              <p className="brand-label">Nail concerns</p>
                              <p className="text-sm text-[#57534e]">{clientDetails.customer.healthInfo.nailConcerns}</p>
                            </div>
                          )}
                          {clientDetails.customer.healthInfo.nailDamageHistory && (
                            <div>
                              <p className="brand-label">Damage history</p>
                              <p className="text-sm text-[#57534e]">{clientDetails.customer.healthInfo.nailDamageHistory}</p>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}

                {clientDetails.customer.inspoDescription && (
                  <div className="brand-panel-soft p-4 space-y-2">
                      <p className="font-heading text-lg text-[#1c1917]">Inspiration</p>
                      <p className="text-sm text-[#57534e]">{clientDetails.customer.inspoDescription}</p>
                  </div>
                )}

                {clientDetails.customer.notes && (
                  <div className="brand-panel-soft p-4 space-y-2">
                      <p className="font-heading text-lg text-[#1c1917]">Notes</p>
                      <p className="text-sm text-[#57534e]">{clientDetails.customer.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-[#78716c]">No client details available.</div>
            )}
          </div>

          <DialogFooter className={clientModalMode === 'view' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}>
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
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setClientModalMode('edit')}
                  disabled={!clientDetails?.customer}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const id = clientDetails?.customer?.id;
                    if (!id) return;
                    setShowClientModal(false);
                    router.push(`/admin/bookings?customerId=${id}`);
                  }}
                  disabled={!clientDetails?.customer}
                >
                  Bookings
                </Button>
                {canBan && clientDetails?.customer?.isActive === false && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const c = clientDetails?.customer;
                      if (!c) return;
                      setUnbanTarget({
                        id: c.id,
                        name: c.name,
                        email: c.email ?? '',
                        phone: c.phone ?? '',
                        clientType: c.clientType,
                        isVIP: c.isVIP,
                        totalBookings: c.totalBookings ?? 0,
                        completedBookings: c.completedBookings ?? 0,
                        totalSpent: c.totalSpent ?? 0,
                        totalTips: c.totalTips ?? 0,
                        totalDiscounts: c.totalDiscounts ?? 0,
                        lastVisit: c.lastVisit,
                        isActive: false,
                        totalVisits: c.totalBookings ?? 0,
                        hasNotes: false,
                        socialMediaName: c.socialMediaName,
                      });
                    }}
                  >
                    Unban
                  </Button>
                )}
                {canBan && clientDetails?.customer && clientDetails.customer.isActive !== false && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const c = clientDetails?.customer;
                      if (!c) return;
                      setBanTarget({
                        id: c.id,
                        name: c.name,
                        email: c.email,
                        phone: c.phone,
                        socialMediaName: c.socialMediaName,
                      });
                      setBanDialogMode('customer');
                      setBanDialogOpen(true);
                    }}
                  >
                    Ban
                  </Button>
                )}
                <Button type="button" variant="secondary" onClick={() => setShowClientModal(false)}>
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {identifierBans.length > 0 && (
        <div className="brand-panel p-4 space-y-3">
            <div>
              <p className="font-heading text-lg text-[#1c1917]">Banned by details</p>
              <p className="text-xs text-[#78716c]">These identifiers are blocked even if there is no client record.</p>
            </div>
            <div className="space-y-2">
              {identifierBans.map((ban) => (
                <div key={ban.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-[#e7e2db] bg-[#f7f6f4] px-3 py-2">
                  <div className="text-sm text-[#3d342c] space-y-0.5">
                    {ban.name && <p><span className="text-[10px] uppercase tracking-[0.12em] text-[#78716c]">Name</span> {ban.name}</p>}
                    {ban.email && <p><span className="text-[10px] uppercase tracking-[0.12em] text-[#78716c]">Email</span> {ban.email}</p>}
                    {ban.phone && <p><span className="text-[10px] uppercase tracking-[0.12em] text-[#78716c]">Phone</span> {ban.phone}</p>}
                    {ban.socialMediaName && <p><span className="text-[10px] uppercase tracking-[0.12em] text-[#78716c]">Social</span> {ban.socialMediaName}</p>}
                    {ban.reason && <p className="text-xs text-[#78716c]">{ban.reason}</p>}
                  </div>
                  {canBan && (
                    <button
                      type="button"
                      onClick={() => setUnbanIdentifierId(ban.id)}
                      className={`${textActionClass} shrink-0`}
                    >
                      Unban
                    </button>
                  )}
                </div>
              ))}
            </div>
        </div>
      )}

      <BanClientDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        mode={banDialogMode}
        customer={banTarget}
        onBanned={() => {
          toast.success('Client banned');
          fetchClients();
          if (banTarget?.id && clientDetails?.customer?.id === banTarget.id) {
            setClientDetails({
              ...clientDetails,
              customer: { ...clientDetails.customer, isActive: false },
            });
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(unbanTarget)}
        onOpenChange={(open) => { if (!open) setUnbanTarget(null); }}
        title="Unban client"
        description={`Allow ${unbanTarget?.name || 'this client'} to book again?`}
        confirmLabel="Unban"
        variant="default"
        onConfirm={handleUnbanClient}
        isLoading={unbanning}
      />
      <ConfirmDialog
        open={Boolean(unbanIdentifierId)}
        onOpenChange={(open) => { if (!open) setUnbanIdentifierId(null); }}
        title="Remove ban"
        description="This name, email, phone, or social media name will be able to book again."
        confirmLabel="Unban"
        variant="default"
        onConfirm={handleUnbanIdentifier}
        isLoading={unbanning}
      />

      {/* Add Client Dialog */}
      <Dialog open={showAddClientModal} onOpenChange={(open) => !open && setShowAddClientModal(false)}>
        <DialogContent className="max-w-[min(100%,36rem)] sm:max-w-xl flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-3 overscroll-contain">
            <div>
              <label>Name <span className="text-[#5a3830]">*</span></label>
              <Input
                value={addClientDraft.name}
                onChange={(e) => setAddClientDraft((d) => ({ ...d, name: e.target.value }))}
                className="h-10"
                placeholder="Client name"
              />
            </div>
            <div>
              <label>Email</label>
              <Input
                type="email"
                value={addClientDraft.email}
                onChange={(e) => setAddClientDraft((d) => ({ ...d, email: e.target.value }))}
                className="h-10"
                placeholder="Email"
              />
            </div>
            <div>
              <label>Phone</label>
              <Input
                value={addClientDraft.phone}
                onChange={(e) => setAddClientDraft((d) => ({ ...d, phone: e.target.value }))}
                className="h-10"
                placeholder="Phone"
              />
            </div>
            <div>
              <label>Social Media</label>
              <Input
                value={addClientDraft.socialMediaName}
                onChange={(e) => setAddClientDraft((d) => ({ ...d, socialMediaName: e.target.value }))}
                className="h-10"
                placeholder="Social media name"
              />
            </div>
            <div>
              <label>Notes</label>
              <textarea
                value={addClientDraft.notes}
                onChange={(e) => setAddClientDraft((d) => ({ ...d, notes: e.target.value }))}
                className="brand-field min-h-[80px]"
                placeholder="Notes"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="add-vip"
                checked={addClientDraft.isVIP}
                onCheckedChange={(checked) => setAddClientDraft((d) => ({ ...d, isVIP: !!checked }))}
              />
              <label htmlFor="add-vip" className="label-inline">
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


