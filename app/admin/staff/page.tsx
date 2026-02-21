'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import AddUserModal from '@/components/admin/AddUserModal';
import EditUserModal from '@/components/admin/EditUserModal';

const PAGE_SIZE = 10;

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

function filterStaff(rows: Staff[], query: string, statusFilter: string): Staff[] {
  let out = rows;
  const q = query.trim().toLowerCase();
  if (q) {
    out = out.filter((r) =>
      r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }
  if (statusFilter === 'active' || statusFilter === 'inactive') {
    out = out.filter((r) => r.status === statusFilter);
  }
  return out;
}

function paginateStaff(rows: Staff[], page: number, pageSize: number): Staff[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export default function StaffPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const handleEdit = (user: Staff) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const filteredStaff = useMemo(() => filterStaff(staff, searchQuery, statusFilter), [staff, searchQuery, statusFilter]);
  const paginatedStaff = useMemo(() => paginateStaff(filteredStaff, currentPage, PAGE_SIZE), [filteredStaff, currentPage]);
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE));
  const totalItems = filteredStaff.length;

  const getStatusBadge = (status: string) => {
    const cls = status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Staff</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage staff members and their roles</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="h-9 px-4 text-sm font-medium rounded-lg border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="h-9 px-4 text-sm font-medium rounded-lg bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-colors flex items-center gap-2 shadow-sm"
          >
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between" role="alert">
          <span>{error}</span>
          <Button type="button" size="sm" variant="destructive" onClick={fetchUsers}>Retry</Button>
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
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
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
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Name</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Role</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center">
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
                  paginatedStaff.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors duration-100 group">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#1a1a1a]">{item.name}</span>
                          <span className="text-xs text-gray-400 mt-0.5">{item.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 capitalize">{item.role}</span>
                          {item.assignedNailTechName && (
                            <span className="text-xs text-gray-400">Assigned: {item.assignedNailTechName}</span>
                          )}
                          <span className="text-xs text-gray-400">{item.authMethod === 'google' ? 'Google OAuth' : 'Email/Password'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          {getStatusBadge(item.status)}
                          {item.emailVerified && <span className="text-xs text-emerald-600">Verified</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="h-7 px-2.5 text-xs rounded-md border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                          >
                            Edit
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
