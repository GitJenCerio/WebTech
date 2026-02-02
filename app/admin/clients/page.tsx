'use client';

import { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import FilterBar from '@/components/admin/FilterBar';
import ActionDropdown from '@/components/admin/ActionDropdown';
import Badge from '@/components/admin/Badge';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  isVip: boolean;
  hasNotes: boolean;
}

export default function ClientsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const clients: Client[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+63 912 345 6789',
      totalVisits: 12,
      isVip: true,
      hasNotes: true,
    },
    {
      id: '2',
      name: 'Maria Garcia',
      email: 'maria.garcia@email.com',
      phone: '+63 912 345 6790',
      totalVisits: 5,
      isVip: false,
      hasNotes: false,
    },
    {
      id: '3',
      name: 'Emily Chen',
      email: 'emily.chen@email.com',
      phone: '+63 912 345 6791',
      totalVisits: 8,
      isVip: true,
      hasNotes: true,
    },
    {
      id: '4',
      name: 'Jessica Williams',
      email: 'jessica.williams@email.com',
      phone: '+63 912 345 6792',
      totalVisits: 3,
      isVip: false,
      hasNotes: false,
    },
  ];

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
      key: 'isVip',
      header: 'Tag',
      render: (item: Client) => (
        <div>
          {item.isVip ? (
            <Badge variant="vip">VIP</Badge>
          ) : (
            <Badge variant="regular">Regular</Badge>
          )}
        </div>
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

      <DataTable
        title="Clients"
        columns={columns}
        data={clients}
        keyExtractor={(item) => item.id}
        emptyMessage="No clients found"
      />

      <div className="mt-3">
        <Pagination
          currentPage={currentPage}
          totalPages={2}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
