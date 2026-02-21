'use client';

import { useEffect, useState, Fragment, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
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
  const [currentPage, setCurrentPage] = useState(1);
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
    window.location.href = `/admin/bookings?techId=${encodeURIComponent(tech.id)}`;
  };

  const handleViewBookings = (tech: NailTechType) => {
    window.location.href = `/admin/bookings?techId=${encodeURIComponent(tech.id)}`;
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

  const handleDeleteTech = async (tech: NailTechType) => {
    if (!confirm(`Are you sure you want to delete ${tech.name}?`)) return;
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Nail Techs</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage nail technicians and their availability</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="h-9 px-4 text-sm font-medium rounded-lg bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Nail Tech
        </button>
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
                placeholder="Search..."
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
          <div className="overflow-x-auto">
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
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
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
                            onClick={() => handleDeleteTech(item)}
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

      {showAddModal && (
        <Fragment>
          <div 
            className="modal-backdrop fade show" 
            onClick={() => !saving && setShowAddModal(false)}
            style={{ zIndex: 1050 }}
          ></div>
          <div 
            className="modal fade show d-block" 
            tabIndex={-1} 
            role="dialog"
            style={{ zIndex: 1055 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content" style={{ borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                <div className="modal-header" style={{ padding: '1.25rem 1.5rem' }}>
                  <h5 className="modal-title" style={{ fontWeight: 600, color: '#212529', fontSize: '1.25rem' }}>
                    {modalMode === 'add' ? 'Add Nail Technician' : modalMode === 'edit' ? 'Edit Nail Technician' : 'View Nail Technician'}
                  </h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Close"
                    onClick={() => !saving && setShowAddModal(false)}
                    disabled={saving}
                    className="px-2 py-1 text-lg leading-none"
                    style={{ opacity: saving ? 0.5 : 1 }}
                  >
                    ×
                  </Button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium" style={{ color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Name <span className="text-danger">*</span>
                      </label>
                      <Input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                        placeholder="e.g. Jhen"
                        disabled={saving || modalMode === 'view'}
                        style={{ fontSize: '0.875rem' }}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium" style={{ color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Role <span className="text-danger">*</span>
                      </label>
                      <select
                        value={form.role}
                        onChange={(e) => handleChange('role', e.target.value as NailTechType['role'])}
                        disabled={saving || modalMode === 'view'}
                        className="form-select w-100"
                        style={{ fontSize: '0.875rem' }}
                      >
                        <option value="Owner">Owner</option>
                        <option value="Senior Tech">Senior Tech</option>
                        <option value="Junior Tech">Junior Tech</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Service Availability <span className="text-danger">*</span>
                    </label>
                    <select
                      value={form.serviceAvailability}
                      onChange={(e) => handleChange('serviceAvailability', e.target.value as ServiceAvailability)}
                      disabled={saving || modalMode === 'view'}
                      className="form-select w-100"
                      style={{ fontSize: '0.875rem' }}
                    >
                      <option value="Studio only">Studio only</option>
                      <option value="Home service only">Home service only</option>
                      <option value="Studio and Home Service">Studio and Home Service</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Working Days <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex flex-wrap gap-2">
                      {allDays.map((day) => (
                        <Button
                          key={day}
                          type="button"
                          size="sm"
                          variant={form.workingDays.includes(day) ? 'default' : 'secondary'}
                          onClick={() => handleToggleWorkingDay(day)}
                          disabled={saving || modalMode === 'view'}
                          className="min-w-[60px]"
                          style={{ 
                            borderRadius: '8px',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            minWidth: '60px'
                          }}
                        >
                          {day.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                    <small className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                      Select all days this technician is available
                    </small>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium" style={{ color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Discount (%)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={form.discount}
                        onChange={(e) => handleChange('discount', e.target.value)}
                        placeholder="e.g. 15"
                        disabled={saving || modalMode === 'view'}
                        style={{ fontSize: '0.875rem' }}
                      />
                      <small className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                        Optional: Discount percentage for all services
                      </small>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium" style={{ color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Commission (%)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={form.commissionRate}
                        onChange={(e) => handleChange('commissionRate', e.target.value)}
                        placeholder="e.g. 40"
                        disabled={saving || modalMode === 'view'}
                        style={{ fontSize: '0.875rem' }}
                      />
                      <small className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                        Optional: Commission rate (0-100)
                      </small>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Status <span className="text-danger">*</span>
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => handleChange('status', e.target.value as NailTechType['status'])}
                      disabled={saving || modalMode === 'view'}
                      className="form-select w-100"
                      style={{ fontSize: '0.875rem' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '1rem 1.5rem' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => !saving && setShowAddModal(false)}
                    disabled={saving}
                    style={{ 
                      borderRadius: '8px',
                      fontWeight: 500,
                      padding: '0.5rem 1rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </Button>
                  {modalMode !== 'view' && (
                    <Button
                      type="submit" 
                      variant="default"
                      disabled={saving || !form.name.trim()}
                      style={{ 
                        borderRadius: '8px',
                        fontWeight: 500,
                        padding: '0.5rem 1rem',
                        backgroundColor: saving || !form.name.trim() ? '#6c757d' : '#212529',
                        borderColor: saving || !form.name.trim() ? '#6c757d' : '#212529',
                        transition: 'all 0.2s ease',
                        boxShadow: saving || !form.name.trim() ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {saving ? (
                        <Fragment>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </Fragment>
                      ) : (
                        <Fragment>
                          <i className="bi bi-check-circle me-2"></i>
                          Save Nail Tech
                        </Fragment>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
          </div>
        </Fragment>
      )}
    </div>
  );
}
