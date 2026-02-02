import React from 'react';
import StatusBadge, { BookingStatus } from '../StatusBadge';
import ActionDropdown from '../ActionDropdown';
import NailTechBadge from '../NailTechBadge';

interface SlotItemProps {
  time: string;
  status: BookingStatus;
  nailTechName?: string;
  nailTechRole?: string;
  clientName?: string;
  service?: string;
  onView?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export default function SlotItem({
  time,
  status,
  nailTechName,
  nailTechRole,
  clientName,
  service,
  onView,
  onEdit,
  onCancel,
}: SlotItemProps) {
  const actions = [
    { label: 'View', icon: 'bi-eye', onClick: onView },
    { label: 'Edit', icon: 'bi-pencil', onClick: onEdit },
    { label: 'Cancel', icon: 'bi-x-circle', onClick: onCancel, variant: 'danger' as const },
  ];

  return (
    <div className="card mb-2">
      <div className="card-body py-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="fw-semibold" style={{ minWidth: '70px', flexShrink: 0 }}>
              {time}
            </div>
            <StatusBadge status={status} />
            {nailTechName && (
              <NailTechBadge name={nailTechName} role={nailTechRole} />
            )}
            {clientName && (
              <div>
                <div className="fw-semibold small">{clientName}</div>
                {service && <div className="text-muted small">{service}</div>}
              </div>
            )}
          </div>
          {status === 'booked' && (
            <ActionDropdown actions={actions} />
          )}
          {status === 'available' && (
            <button className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-plus"></i> Book
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
