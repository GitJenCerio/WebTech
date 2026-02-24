'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { Button, Input } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/Card';
import type { NailTech as NailTechType, ServiceAvailability } from '@/lib/types';

const PAGE_SIZE = 10;

type NailTechFormState = {
  name: string;
  role: NailTechType['role'];
  serviceAvailability: ServiceAvailability;
  discount: string;
  commissionRate: string;
  workingDays: string[];
  status: NailTechType['status'];
};

const DEFAULT_FORM_STATE: NailTechFormState = {
  name: '',
  role: 'Junior Tech',
  serviceAvailability: 'Studio only',
  discount: '',
  commissionRate: '',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  status: 'Active',
};

function filterNailTechs(rows: NailTechType[], query: string, statusFilter: string): NailTechType[] {
  let out = rows;
  const q = query.trim().toLowerCase();
  if (q) {
    out = out.filter((r) => r.name.toLowerCase().includes(q));
  }
  if (statusFilter === 'active' || statusFilter === 'inactive') {
    out = out.filter((r) => r.status.toLowerCase() === statusFilter);
  }
  return out;
}

function paginateNailTechs(rows: NailTechType[], page: number, pageSize: number): NailTechType[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export default function NailTechsPage() {
  const router = useRouter();
  const userRole = useUserRole();
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [techToDelete, setTechToDelete] = useState<NailTechType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nailTechs, setNailTechs] = useState<NailTechType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NailTechFormState>(DEFAULT_FORM_STATE);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  useEffect(() => {
    async function loadNailTechs() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/nail-techs');
        if (!res.ok) {
          throw new Error('Failed to load nail techs');
        }
        const data = await res.json();
        setNailTechs(data.nailTechs || []);
      } catch (err: any) {
        console.error('Error loading nail techs', err);
        setError(err.message || 'Failed to load nail techs');
      } finally {
        setLoading(false);
      }
    }

    loadNailTechs();
  }, []);

  const handleOpenAdd = () => {
    setForm(DEFAULT_FORM_STATE);
    setModalMode('add');
    setSelectedTechId(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (tech: NailTechType) => {
    setForm({
      name: tech.name,
      role: tech.role,
      serviceAvailability: tech.serviceAvailability,
      discount: tech.discount != null ? String(tech.discount) : '',
      commissionRate: tech.commissionRate != null ? String(Math.round(tech.commissionRate * 100)) : '',
      workingDays: tech.workingDays || [],
      status: tech.status,
    });
    setModalMode('edit');
    setSelectedTechId(tech.id);
    setShowAddModal(true);
  };

  const handleOpenView = (tech: NailTechType) => {
    setForm({
      name: tech.name,
      role: tech.role,
      serviceAvailability: tech.serviceAvailability,
      discount: tech.discount != null ? String(tech.discount) : '',
      commissionRate: tech.commissionRate != null ? String(Math.round(tech.commissionRate * 100)) : '',
      workingDays: tech.workingDays || [],
      status: tech.status,
    });
    setModalMode('view');
    setSelectedTechId(tech.id);
    setShowAddModal(true);
  };

  const handleViewSlots = (tech: NailTechType) => {
    router.push(`/admin/bookings?techId=${encodeURIComponent(tech.id)}`);
  };

  const handleViewBookings = (tech: NailTechType) => {
    router.push(`/admin/bookings?techId=${encodeURIComponent(tech.id)}`);
  };

  const handleChange = (field: keyof NailTechFormState, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleWorkingDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSaving(true);
      setError(null);

      const discountNumber = form.discount ? Number(form.discount) : undefined;
      const commissionNumber = form.commissionRate ? Number(form.commissionRate) / 100 : undefined;

      const isEdit = modalMode === 'edit' && selectedTechId;
      const url = isEdit ? `/api/nail-techs/${selectedTechId}` : '/api/nail-techs';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role,
          serviceAvailability: form.serviceAvailability,
          workingDays: form.workingDays,
          discount: isNaN(discountNumber as number) ? undefined : discountNumber,
          commissionRate: isNaN(commissionNumber as number) ? undefined : commissionNumber,
          status: form.status,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create nail tech');
      }

      const data = await res.json();
      if (isEdit) {
        setNailTechs((prev) =>
          prev
            .map((tech) => (tech.id === data.nailTech.id ? data.nailTech : tech))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        setNailTechs((prev) => [...prev, data.nailTech].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setShowAddModal(false);
      setForm(DEFAULT_FORM_STATE);
    } catch (err: any) {
      console.error('Error saving nail tech', err);
      setError(err.message || 'Failed to save nail tech');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (tech: NailTechType) => {
    try {
      setSaving(true);
      setError(null);
      const nextStatus = tech.status === 'Active' ? 'Inactive' : 'Active';
      const res = await fetch(`/api/nail-techs/${tech.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update status');
      }
      const data = await res.json();
      setNailTechs((prev) =>
        prev.map((t) => (t.id === data.nailTech.id ? data.nailTech : t))
      );
    } catch (err: any) {
      console.error('Error updating status', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDeleteTech = (tech: NailTechType) => {
    setTechToDelete(tech);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteTech = async () => {
    if (!techToDelete) return;
    const tech = techToDelete;
    setTechToDelete(null);
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/nail-techs/${tech.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete nail tech');
      }
      // DELETE is a soft delete (sets status to Inactive)
      setNailTechs((prev) =>
        prev.map((t) => (t.id === tech.id ? { ...t, status: 'Inactive' } : t))
      );
      setDeleteConfirmOpen(false);
    } catch (err: any) {
      console.error('Error deleting nail tech', err);
      setError(err.message || 'Failed to delete nail tech');
    } finally {
      setSaving(false);
    }
  };

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredTechs = useMemo(() => filterNailTechs(nailTechs, searchQuery, statusFilter), [nailTechs, searchQuery, statusFilter]);
  const paginatedTechs = useMemo(() => paginateNailTechs(filteredTechs, currentPage, PAGE_SIZE), [filteredTechs, currentPage]);
  const totalPages = Math.max(1, Math.ceil(filteredTechs.length / PAGE_SIZE));
  const totalItems = filteredTechs.length;

  const getStatusBadge = (status: string) => {
    const cls = status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {userRole.canManageAllTechs && (
          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto min-h-[44px] px-4 text-sm font-medium rounded-lg bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Nail Tech
          </button>
        )}
      </div>

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
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 min-w-0 sm:min-w-[140px] h-9 px-3">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
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
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0f0f0]" style={{ background: 'linear-gradient(to right, #fafafa, #f5f5f5)' }}>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Name</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Role</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Discount</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Commission</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Service Availability</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {loading ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-5 py-3.5">
                            <div className="h-4 w-20 animate-pulse rounded bg-[#e5e5e5]" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : paginatedTechs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
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
                  paginatedTechs.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors duration-100 group">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#1a1a1a]">Ms. {item.name}</span>
                          <span className="text-xs text-gray-400 mt-0.5">{item.role}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">{item.role}</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#1a1a1a] tabular-nums">{item.discount != null ? `${item.discount}%` : '—'}</td>
                      <td className="px-5 py-3.5 font-medium text-[#1a1a1a] tabular-nums">{item.commissionRate != null ? `${Math.round(item.commissionRate * 100)}%` : '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500">{item.serviceAvailability}</td>
                      <td className="px-5 py-3.5">{getStatusBadge(item.status)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenView(item)}
                            className="h-7 px-2.5 text-xs rounded-md border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="h-7 px-2.5 text-xs rounded-md border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleViewSlots(item)}
                            className="h-7 px-2.5 text-xs rounded-md border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                          >
                            Slots
                          </button>
                          <button
                            onClick={() => handleRequestDeleteTech(item)}
                            className="h-7 px-2.5 text-xs rounded-md border border-transparent bg-white text-gray-300 hover:border-red-200 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                      <div className="space-y-1">
                        <div className="h-5 w-28 animate-pulse rounded bg-[#e5e5e5]" />
                        <div className="h-4 w-20 animate-pulse rounded bg-[#e5e5e5]" />
                      </div>
                      <div className="h-6 w-16 animate-pulse rounded-full bg-[#e5e5e5]" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="space-y-1">
                          <div className="h-3 w-12 animate-pulse rounded bg-[#e5e5e5]" />
                          <div className="h-4 w-16 animate-pulse rounded bg-[#e5e5e5]" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : paginatedTechs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                <div className="h-10 w-10 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                  <Search className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">No results found</span>
                <span className="text-xs">Try adjusting your search or filters</span>
              </div>
            ) : (
              paginatedTechs.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#1a1a1a]">Ms. {item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.role}</p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Discount</span>
                      <p className="text-[#1a1a1a]">{item.discount != null ? `${item.discount}%` : '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Commission</span>
                      <p className="text-[#1a1a1a]">{item.commissionRate != null ? `${Math.round(item.commissionRate * 100)}%` : '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Service</span>
                      <p className="text-[#1a1a1a]">{item.serviceAvailability}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={() => handleOpenView(item)}
                      className="w-full h-10 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-sm font-medium text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa] transition-all"
                    >
                      View
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="flex-1 h-10 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-sm font-medium text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleViewSlots(item)}
                        className="flex-1 h-10 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-sm font-medium text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                      >
                        Slots
                      </button>
                    </div>
                    <button
                      onClick={() => handleRequestDeleteTech(item)}
                      className="w-full h-10 flex items-center justify-center rounded-lg border border-transparent bg-white text-gray-400 hover:border-red-200 hover:text-red-500 transition-all text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-9 min-w-[44px] flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm px-2"><ChevronLeft className="h-4 w-4" /></button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg border text-xs font-medium transition-all ${currentPage === page ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-sm' : 'border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'}`}
                    >{page}</button>
                  );
                })}
              </div>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-9 min-w-[44px] flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm px-2"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={(open) => !saving && setShowAddModal(open)}>
        <DialogContent className="sm:max-w-lg md:max-w-md max-h-[90vh] overflow-y-auto border-[#e5e5e5] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#1a1a1a]">
              {modalMode === 'add' ? 'Add Nail Technician' : modalMode === 'edit' ? 'Edit Nail Technician' : 'View Nail Technician'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Name <span className="text-red-500">*</span></label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="e.g. Jhen"
                  disabled={saving || modalMode === 'view'}
                  className="h-9 rounded-xl border-[#e5e5e5] bg-[#f9f9f9]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Role <span className="text-red-500">*</span></label>
                <Select
                  value={form.role}
                  onValueChange={(v) => handleChange('role', v as NailTechType['role'])}
                  disabled={saving || modalMode === 'view'}
                >
                  <SelectTrigger className="h-9 rounded-xl border-[#e5e5e5] bg-[#f9f9f9]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Senior Tech">Senior Tech</SelectItem>
                    <SelectItem value="Junior Tech">Junior Tech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Service Availability <span className="text-red-500">*</span></label>
              <Select
                value={form.serviceAvailability}
                onValueChange={(v) => handleChange('serviceAvailability', v as ServiceAvailability)}
                disabled={saving || modalMode === 'view'}
              >
                <SelectTrigger className="h-9 rounded-xl border-[#e5e5e5] bg-[#f9f9f9]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Studio only">Studio only</SelectItem>
                  <SelectItem value="Home service only">Home service only</SelectItem>
                  <SelectItem value="Studio and Home Service">Studio and Home Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Working Days <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {allDays.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    size="sm"
                    variant={form.workingDays.includes(day) ? 'default' : 'secondary'}
                    onClick={() => handleToggleWorkingDay(day)}
                    disabled={saving || modalMode === 'view'}
                    className="min-w-[60px] rounded-lg h-9"
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
              <small className="text-gray-500 text-xs block mt-1.5">Select all days this technician is available</small>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Discount (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discount}
                  onChange={(e) => handleChange('discount', e.target.value)}
                  placeholder="e.g. 15"
                  disabled={saving || modalMode === 'view'}
                  className="h-9 rounded-xl border-[#e5e5e5] bg-[#f9f9f9]"
                />
                <small className="text-gray-500 text-xs block mt-1">Optional: Discount percentage for all services</small>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Commission (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.commissionRate}
                  onChange={(e) => handleChange('commissionRate', e.target.value)}
                  placeholder="e.g. 40"
                  disabled={saving || modalMode === 'view'}
                  className="h-9 rounded-xl border-[#e5e5e5] bg-[#f9f9f9]"
                />
                <small className="text-gray-500 text-xs block mt-1">Optional: Commission rate (0-100)</small>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Status <span className="text-red-500">*</span></label>
              <Select
                value={form.status}
                onValueChange={(v) => handleChange('status', v as NailTechType['status'])}
                disabled={saving || modalMode === 'view'}
              >
                <SelectTrigger className="h-9 rounded-xl border-[#e5e5e5] bg-[#f9f9f9]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                disabled={saving}
                className="rounded-xl"
              >
                Cancel
              </Button>
              {modalMode !== 'view' && (
                <Button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="rounded-xl bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white"
                >
                  {saving ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent inline-block mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle mr-2" />
                      Save Nail Tech
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setTechToDelete(null);
        }}
        title="Delete nail tech"
        description={techToDelete ? `Are you sure you want to delete ${techToDelete.name}?` : ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => handleConfirmDeleteTech()}
        isLoading={saving}
      />
    </div>
  );
}
