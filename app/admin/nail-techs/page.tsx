'use client';

import { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import ActionDropdown from '@/components/admin/ActionDropdown';
import Badge from '@/components/admin/Badge';

interface NailTech {
  id: string;
  name: string;
  role: 'Owner' | 'Senior Tech' | 'Junior Tech';
  email: string;
  phone: string;
  discount: number; // Percentage (e.g., 15 for 15%)
  commissionRate: number; // Percentage (e.g., 40 for 40%)
  serviceAvailability: 'Studio only' | 'Home service only' | 'Studio and Home Service';
  status: 'Active' | 'Inactive';
}

export default function NailTechsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data
  const nailTechs: NailTech[] = [
    {
      id: '1',
      name: 'Jhen',
      role: 'Owner',
      email: 'jhen@glammednailsbyjhen.com',
      phone: '+63 912 345 6789',
      discount: 15,
      commissionRate: 40,
      serviceAvailability: 'Studio and Home Service',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Maria Santos',
      role: 'Senior Tech',
      email: 'maria@glammednailsbyjhen.com',
      phone: '+63 912 345 6790',
      discount: 10,
      commissionRate: 50,
      serviceAvailability: 'Studio only',
      status: 'Active',
    },
    {
      id: '3',
      name: 'Anna Cruz',
      role: 'Junior Tech',
      email: 'anna@glammednailsbyjhen.com',
      phone: '+63 912 345 6791',
      discount: 5,
      commissionRate: 60,
      serviceAvailability: 'Studio and Home Service',
      status: 'Active',
    },
  ];

  const getRoleBadge = (role: string) => {
    if (role === 'Owner') {
      return <Badge variant="vip">{role}</Badge>;
    } else if (role === 'Senior Tech') {
      return <Badge variant="regular">{role}</Badge>;
    }
    return <Badge variant="regular">{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return status === 'Active' ? (
      <Badge variant="available">Active</Badge>
    ) : (
      <Badge variant="disabled">Inactive</Badge>
    );
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: NailTech) => (
        <div>
          <div className="fw-semibold">{item.name}</div>
          <small className="text-muted">{item.email}</small>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (item: NailTech) => getRoleBadge(item.role),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (item: NailTech) => (
        <span className="fw-semibold">{item.discount}%</span>
      ),
    },
    {
      key: 'commissionRate',
      header: 'Commission',
      render: (item: NailTech) => (
        <span className="fw-semibold">{item.commissionRate}%</span>
      ),
    },
    {
      key: 'serviceAvailability',
      header: 'Service Availability',
      render: (item: NailTech) => (
        <small className="text-muted">{item.serviceAvailability}</small>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: NailTech) => getStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: NailTech) => (
        <ActionDropdown
          actions={[
            { label: 'View', icon: 'bi-eye' },
            { label: 'Edit', icon: 'bi-pencil' },
            { label: 'View Slots', icon: 'bi-calendar-check' },
            { label: 'View Bookings', icon: 'bi-file-text' },
            {
              label: item.status === 'Active' ? 'Deactivate' : 'Activate',
              icon: item.status === 'Active' ? 'bi-x-circle' : 'bi-check-circle',
              variant: item.status === 'Active' ? 'danger' : 'default',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 style={{ fontWeight: 600, color: '#212529', margin: 0 }}>
          Nail Tech Management
        </h4>
        <button className="btn btn-dark">
          <i className="bi bi-person-plus me-2"></i>Add Nail Tech
        </button>
      </div>

      <DataTable
        title="Nail Technicians"
        columns={columns}
        data={nailTechs}
        keyExtractor={(item) => item.id}
        emptyMessage="No nail technicians found"
      />

      <div className="mt-3">
        <Pagination
          currentPage={currentPage}
          totalPages={1}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
