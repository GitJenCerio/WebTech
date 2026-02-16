'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import ActionDropdown from '@/components/admin/ActionDropdown';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import StatusBadge, { BookingStatus } from '@/components/admin/StatusBadge';
import AddUserModal from '@/components/admin/AddUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2 } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  assignedNailTechId?: string | null;
  assignedNailTechName?: string;
  status: 'active' | 'inactive';
  authMethod?: 'google' | 'password';
  emailVerified?: boolean;
}

export default function StaffPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nailTechs, setNailTechs] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch users from database
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch both users and nail techs in parallel
      const [usersResponse, nailTechsResponse] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/nail-techs?activeOnly=true')
      ]);

      const usersData = await usersResponse.json();
      const nailTechsData = await nailTechsResponse.json();

      if (!usersResponse.ok) {
        throw new Error(usersData.error || 'Failed to fetch users');
      }

      // Update nail techs if fetched successfully
      if (nailTechsResponse.ok && nailTechsData.nailTechs) {
        setNailTechs(nailTechsData.nailTechs);
      }

      // Map database users to Staff interface
      const techs = nailTechsResponse.ok && nailTechsData.nailTechs ? nailTechsData.nailTechs : nailTechs;
      const mappedStaff: Staff[] = usersData.users.map((user: any) => {
        // Find assigned nail tech name
        const assignedNailTech = techs.find((tech: any) => tech.id === user.assignedNailTechId);
        
        return {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          role: (user.role || 'admin') as 'admin' | 'staff',
          assignedNailTechId: user.assignedNailTechId || null,
          assignedNailTechName: assignedNailTech?.name,
          status: (user.status || 'active') as 'active' | 'inactive',
          authMethod: user.authMethod,
          emailVerified: user.emailVerified,
        };
      });

      setStaff(mappedStaff);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="vip">Admin</Badge>;
    }
    return <Badge variant="regular">Staff</Badge>;
  };

  const handleEdit = (user: Staff) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
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
          <div className="font-semibold">{item.name}</div>
          <small className="text-gray-600">{item.email}</small>
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
              <small className="text-gray-600">
                Assigned to: {item.assignedNailTechName}
              </small>
            </div>
          )}
          <div className="mt-1">
            <small className="text-gray-600">
              {item.authMethod === 'google' ? (
                <span>Google OAuth</span>
              ) : (
                <span>Email/Password</span>
              )}
            </small>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Staff) => (
        <div>
          {getStatusBadge(item.status)}
          {item.emailVerified && (
            <div className="mt-1">
              <small className="text-green-600">
                Verified
              </small>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: Staff) => (
        <ActionDropdown
          actions={[
            { 
              label: 'Edit', 
              icon: 'bi-pencil',
              onClick: () => handleEdit(item)
            },
            ...(item.authMethod === 'password' ? [{ label: 'Reset Password', icon: 'bi-key' }] : []),
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

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 style={{ fontWeight: 600, color: '#212529', margin: 0 }}>
            Staff / Users
          </h4>
          <Button
            type="button"
            onClick={() => setShowAddUserModal(true)}
          >
            Add User
          </Button>
        </div>
        <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto" />
            <p className="mt-3 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 style={{ fontWeight: 600, color: '#212529', margin: 0 }}>
            Staff / Users
          </h4>
          <Button
            type="button"
            onClick={() => setShowAddUserModal(true)}
          >
            Add User
          </Button>
        </div>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span><strong>Error loading users:</strong> {error}</span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="ml-3"
                onClick={fetchUsers}
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 style={{ fontWeight: 600, color: '#212529', margin: 0 }}>
          Staff / Users
          <span className="text-gray-600 ml-2" style={{ fontSize: '0.875rem', fontWeight: 400 }}>
            ({staff.length} {staff.length === 1 ? 'user' : 'users'})
          </span>
        </h4>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={fetchUsers}
            disabled={loading}
            title="Refresh users list"
          >
            Refresh
          </Button>
          <Button
            type="button"
            onClick={() => setShowAddUserModal(true)}
          >
            Add User
          </Button>
        </div>
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

      {/* Add User Modal */}
      <AddUserModal
        show={showAddUserModal}
        onHide={() => setShowAddUserModal(false)}
        onUserAdded={() => {
          // Refetch users after adding
          fetchUsers();
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        show={showEditUserModal}
        onHide={() => {
          setShowEditUserModal(false);
          setSelectedUser(null);
        }}
        onUserUpdated={() => {
          // Refetch users after updating
          fetchUsers();
        }}
        user={selectedUser}
      />
    </div>
  );
}
