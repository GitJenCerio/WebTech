'use client';

import { useEffect, useState, Fragment } from 'react';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import ActionDropdown from '@/components/admin/ActionDropdown';
import { Badge } from '@/components/ui/Badge';
import { Button, Input, Select } from '@/components/ui/Index';
import type { NailTech as NailTechType, ServiceAvailability } from '@/lib/types';

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

export default function NailTechsPage() {
  const [currentPage, setCurrentPage] = useState(1);
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
      render: (item: NailTechType) => (
        <div>
          <div className="fw-semibold">Ms. {item.name}</div>
          <small className="text-muted">{item.role}</small>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (item: NailTechType) => getRoleBadge(item.role),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (item: NailTechType) => (
        <span className="fw-semibold">
          {item.discount != null ? `${item.discount}%` : '—'}
        </span>
      ),
    },
    {
      key: 'commissionRate',
      header: 'Commission',
      render: (item: NailTechType) => (
        <span className="fw-semibold">
          {item.commissionRate != null ? `${Math.round(item.commissionRate * 100)}%` : '—'}
        </span>
      ),
    },
    {
      key: 'serviceAvailability',
      header: 'Service Availability',
      render: (item: NailTechType) => (
        <small className="text-muted">{item.serviceAvailability}</small>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: NailTechType) => getStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: NailTechType) => (
        <ActionDropdown
          actions={[
            { label: 'View', icon: 'bi-eye', onClick: () => handleOpenView(item) },
            { label: 'Edit', icon: 'bi-pencil', onClick: () => handleOpenEdit(item) },
            { label: 'View Slots', icon: 'bi-calendar-check', onClick: () => handleViewSlots(item) },
            { label: 'View Bookings', icon: 'bi-file-text', onClick: () => handleViewBookings(item) },
            {
              label: item.status === 'Active' ? 'Deactivate' : 'Activate',
              icon: item.status === 'Active' ? 'bi-x-circle' : 'bi-check-circle',
              variant: item.status === 'Active' ? 'danger' : 'default',
              onClick: () => handleToggleStatus(item),
            },
            {
              label: 'Delete',
              icon: 'bi-trash',
              variant: 'danger',
              onClick: () => handleDeleteTech(item),
            },
          ]}
        />
      ),
    },
  ];

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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 style={{ fontWeight: 600, color: '#212529', margin: 0 }}>
          Nail Tech Management
        </h4>
        <Button type="button" onClick={handleOpenAdd}>
          <i className="bi bi-person-plus me-2"></i>Add Nail Tech
        </Button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted">Loading nail technicians...</div>
      ) : (
        <DataTable
          title="Nail Technicians"
          columns={columns}
          data={nailTechs}
          keyExtractor={(item) => item.id}
          emptyMessage="No nail technicians found"
        />
      )}

      <div className="mt-3">
        <Pagination
          currentPage={currentPage}
          totalPages={1}
          onPageChange={setCurrentPage}
        />
      </div>

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
                      <Select
                        value={form.role}
                        onChange={(e) => handleChange('role', e.target.value as NailTechType['role'])}
                        disabled={saving || modalMode === 'view'}
                        style={{ fontSize: '0.875rem' }}
                      >
                        <option value="Owner">Owner</option>
                        <option value="Senior Tech">Senior Tech</option>
                        <option value="Junior Tech">Junior Tech</option>
                      </Select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ color: '#495057', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Service Availability <span className="text-danger">*</span>
                    </label>
                    <Select
                      value={form.serviceAvailability}
                      onChange={(e) => handleChange('serviceAvailability', e.target.value as ServiceAvailability)}
                      disabled={saving || modalMode === 'view'}
                      style={{ fontSize: '0.875rem' }}
                    >
                      <option value="Studio only">Studio only</option>
                      <option value="Home service only">Home service only</option>
                      <option value="Studio and Home Service">Studio and Home Service</option>
                    </Select>
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
                          variant={form.workingDays.includes(day) ? 'primary' : 'secondary'}
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
                    <Select
                      value={form.status}
                      onChange={(e) => handleChange('status', e.target.value as NailTechType['status'])}
                      disabled={saving || modalMode === 'view'}
                      style={{ fontSize: '0.875rem' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Select>
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
                      variant="primary"
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
