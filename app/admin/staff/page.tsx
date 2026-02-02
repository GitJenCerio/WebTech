'use client';

import { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import ActionDropdown from '@/components/admin/ActionDropdown';
import Badge from '@/components/admin/Badge';
import StatusBadge, { BookingStatus } from '@/components/admin/StatusBadge';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Nail Tech';
  assignedNailTechId?: string;
  assignedNailTechName?: string;
  status: 'active' | 'inactive';
}

export default function StaffPage() {
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data
  const staff: Staff[] = [
    {
      id: '1',
      name: 'Juliana Adams',
      email: 'juliana@glammednailsbyjhen.com',
      role: 'Admin',
      status: 'active',
    },
    {
      id: '2',
      name: 'Sarah Williams',
      email: 'sarah@glammednailsbyjhen.com',
      role: 'Staff',
      assignedNailTechId: '1',
      assignedNailTechName: 'Jhen',
      status: 'active',
    },
    {
      id: '3',
      name: 'Lisa Brown',
      email: 'lisa@glammednailsbyjhen.com',
      role: 'Staff',
      assignedNailTechId: '2',
      assignedNailTechName: 'Maria Santos',
      status: 'active',
    },
  ];

  const getRoleBadge = (role: string) => {
    if (role === 'Admin') {
      return <Badge variant="vip">{role}</Badge>;
    }
    return <Badge variant="regular">{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <StatusBadge status="available" />
    ) : (
      <StatusBadge status="disabled" />
    );
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: Staff) => (
        <div>
          <div className="fw-semibold">{item.name}</div>
          <small className="text-muted">{item.email}</small>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (item: Staff) => (
        <div>
          {getRoleBadge(item.role)}
          {item.assignedNailTechName && (
            <div className="mt-1">
              <small className="text-muted">
                Assigned to: {item.assignedNailTechName}
              </small>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Staff) => getStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: Staff) => (
        <ActionDropdown
          actions={[
            { label: 'Edit', icon: 'bi-pencil' },
            { label: 'Reset Password', icon: 'bi-key' },
            {
              label: item.status === 'active' ? 'Disable' : 'Enable',
              icon: item.status === 'active' ? 'bi-x-circle' : 'bi-check-circle',
              variant: item.status === 'active' ? 'danger' : 'default',
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
          Staff / Users
        </h4>
        <button className="btn btn-dark">
          <i className="bi bi-person-plus me-2"></i>Add User
        </button>
      </div>

      <DataTable
        title="Staff Members"
        columns={columns}
        data={staff}
        keyExtractor={(item) => item.id}
        emptyMessage="No staff members found"
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
