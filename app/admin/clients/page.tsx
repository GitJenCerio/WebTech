'use client';

import { useState, useEffect, useMemo } from 'react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import FilterBar from '@/components/admin/FilterBar';
import ActionDropdown from '@/components/admin/ActionDropdown';
import Badge from '@/components/admin/Badge';

const PAGE_SIZE = 10;

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  hasNotes: boolean;
}

interface ApiCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  totalVisits: number;
}

function mapApiToClient(c: ApiCustomer): Client {
  return {
    id: c.id,
    name: c.name,
    email: c.email ?? '',
    phone: c.phone ?? '',
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
            { label: 'View', icon: 'bi-eye' },
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
    </div>
  );
}
