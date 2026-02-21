'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Card, CardContent } from "@/components/ui/Card";

const PAGE_SIZE = 10;

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  clientType?: 'NEW' | 'REPEAT';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientDetails, setClientDetails] = useState<any | null>(null);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);
  const [clientDetailsError, setClientDetailsError] = useState<string | null>(null);

  const handleViewClient = useCallback(async (clientId: string) => {
    try {
      setClientDetailsLoading(true);
      setClientDetailsError(null);
      setShowClientModal(true);

      const response = await fetch(`/api/customers/${clientId}`);
      if (!response.ok) throw new Error('Failed to load client details');
      const data = await response.json();
      setClientDetails(data);
    } catch (err: any) {
      setClientDetailsError(err.message || 'Failed to load client details');
    } finally {
      setClientDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('customerId');
    if (clientId) {
      handleViewClient(clientId);
    }
  }, [handleViewClient]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    fetch(`/api/customers?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Failed to fetch clients');
        return res.json();
      })
      .then((data: { customers: ApiCustomer[] }) => {
        if (!cancelled) {
          setClients((data.customers ?? []).map(mapApiToClient));
          setCurrentPage(1);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load clients');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return clients.slice(start, start + PAGE_SIZE);
  }, [clients, currentPage]);

  const totalItems = clients.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your client roster</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Filter Card */}
      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <div className="h-10 w-10 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                          <Search className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">No results found</span>
                        <span className="text-xs">Try adjusting your search or filters</span>
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
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">Regular</span>
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
                            onClick={() => handleViewClient(item.id)}
                            className="h-7 px-2.5 text-xs rounded-md border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {}}
                            className="h-7 px-2.5 text-xs rounded-md border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { window.location.href = `/admin/bookings?customerId=${item.id}`; }}
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
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-400">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                    currentPage === page ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-sm' : 'border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Dialog open={showClientModal} onOpenChange={(open) => !open && setShowClientModal(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
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
            <Button type="button" variant="secondary" onClick={() => setShowClientModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


