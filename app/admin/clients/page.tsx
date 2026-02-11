'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import FilterBar from '@/components/admin/FilterBar';
import ActionDropdown from '@/components/admin/ActionDropdown';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui';

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

  const columns = [
    {
      key: 'name',
      header: 'Client Name',
      render: (item: Client) => (
        <div>
          <div className="fw-semibold">{item.name}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (item: Client) => (
        <div>
          <div>{item.email}</div>
          <small className="text-muted">{item.phone}</small>
        </div>
      ),
    },
    {
      key: 'totalVisits',
      header: 'Total Visits',
      render: (item: Client) => (
        <span className="fw-semibold">{item.totalVisits}</span>
      ),
    },
    {
      key: 'tag',
      header: 'Tag',
      render: () => (
        <Badge variant="regular">Regular</Badge>
      ),
    },
    {
      key: 'hasNotes',
      header: 'Notes',
      render: (item: Client) =>
        item.hasNotes ? (
          <i className="bi bi-file-text text-muted" title="Has notes"></i>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: Client) => (
        <ActionDropdown
          actions={[
            { label: 'View', icon: 'bi-eye', onClick: () => handleViewClient(item.id) },
            { label: 'Edit', icon: 'bi-pencil' },
            { label: 'View Bookings', icon: 'bi-calendar-check' },
            { label: 'Add Note', icon: 'bi-file-plus' },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <h4 className="mb-4" style={{ fontWeight: 600, color: '#212529' }}>
        Clients
      </h4>

      <FilterBar
        searchPlaceholder="Search clients by name, email, or phone..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted py-4">Loading clients...</div>
      ) : (
        <>
          <DataTable
            title="Clients"
            columns={columns}
            data={paginatedClients}
            keyExtractor={(item) => item.id}
            emptyMessage="No clients found"
          />

          {totalPages > 1 && (
            <div className="mt-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {showClientModal && (
        <div
          className={`modal fade ${showClientModal ? 'show' : ''}`}
          style={{
            display: showClientModal ? 'flex' : 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1055,
          }}
          tabIndex={-1}
          role="dialog"
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 0,
            }}
            onClick={() => setShowClientModal(false)}
          />

          <div
            className="modal-dialog modal-dialog-centered"
            style={{ margin: '0.5rem auto', position: 'relative', zIndex: 1, width: 'min(96vw, 720px)' }}
            role="document"
          >
            <div className="modal-content">
              <div className="modal-header py-2 px-3">
                <h5 className="modal-title">Client Details</h5>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClientModal(false)}
                  aria-label="Close"
                  className="px-2 py-1 text-lg leading-none"
                >
                  ×
                </Button>
              </div>

              <div className="modal-body p-3" style={{ fontSize: '0.92rem' }}>
                {clientDetailsLoading ? (
                  <div className="text-muted">Loading client details...</div>
                ) : clientDetailsError ? (
                  <div className="alert alert-danger">{clientDetailsError}</div>
                ) : clientDetails?.customer ? (
                  <>
                    <div className="mb-2 p-2 border rounded bg-light">
                      <div className="d-flex flex-column gap-1">
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
                    </div>

                    <div className="mb-2 p-2 border rounded bg-light">
                      <div className="d-flex flex-wrap gap-3">
                        <span><strong>Total Bookings:</strong> {clientDetails.customer.totalBookings ?? 0}</span>
                        <span><strong>Completed:</strong> {clientDetails.customer.completedBookings ?? 0}</span>
                        <span><strong>Last Visit:</strong> {clientDetails.customer.lastVisit ? new Date(clientDetails.customer.lastVisit).toLocaleDateString('en-US') : '-'}</span>
                        <span><strong>Total Spent:</strong> PHP {(clientDetails.customer.totalSpent ?? 0).toLocaleString()}</span>
                        <span><strong>Total Tips:</strong> PHP {(clientDetails.customer.totalTips ?? 0).toLocaleString()}</span>
                        <span><strong>Total Discounts:</strong> PHP {(clientDetails.customer.totalDiscounts ?? 0).toLocaleString()}</span>
                        <span><strong>Client Type:</strong> {clientDetails.customer.clientType || 'NEW'}</span>
                        <span><strong>Status:</strong> {clientDetails.customer.isActive === false ? 'Inactive' : 'Active'}</span>
                      </div>
                    </div>

                    {(clientDetails.customer.nailHistory || clientDetails.customer.healthInfo) && (
                      <div className="mb-2 p-2 border rounded bg-light">
                        {clientDetails.customer.nailHistory && (
                          <div className="mb-2">
                            <div className="fw-semibold">Nail History</div>
                            <div className="text-muted small">
                              Russian Manicure: {clientDetails.customer.nailHistory.hasRussianManicure ? 'Yes' : 'No'} | 
                              Gel Overlay: {clientDetails.customer.nailHistory.hasGelOverlay ? 'Yes' : 'No'} | 
                              Softgel Extensions: {clientDetails.customer.nailHistory.hasSoftgelExtensions ? 'Yes' : 'No'}
                            </div>
                          </div>
                        )}
                        {clientDetails.customer.healthInfo && (
                          <div>
                            <div className="fw-semibold">Health Info</div>
                            {clientDetails.customer.healthInfo.allergies && (
                              <div className="text-muted small">Allergies: {clientDetails.customer.healthInfo.allergies}</div>
                            )}
                            {clientDetails.customer.healthInfo.nailConcerns && (
                              <div className="text-muted small">Nail Concerns: {clientDetails.customer.healthInfo.nailConcerns}</div>
                            )}
                            {clientDetails.customer.healthInfo.nailDamageHistory && (
                              <div className="text-muted small">Damage History: {clientDetails.customer.healthInfo.nailDamageHistory}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {clientDetails.customer.inspoDescription ? (
                      <div className="mb-2 p-2 border rounded bg-light">
                        <div className="fw-semibold">Inspiration Description</div>
                        <div className="text-muted small">{clientDetails.customer.inspoDescription}</div>
                      </div>
                    ) : null}

                    {clientDetails.customer.notes ? (
                      <div className="mb-2 p-2 border rounded bg-light">
                        <div className="fw-semibold">Notes</div>
                        <div className="text-muted small">{clientDetails.customer.notes}</div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="text-muted">No client details available.</div>
                )}
              </div>

              <div className="modal-footer py-2 px-3">
                <Button type="button" variant="secondary" onClick={() => setShowClientModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


