import React from 'react';
import { Eye, Pencil, Trash2, EyeOff } from 'lucide-react';
import StatusBadge, { BookingStatus } from '../StatusBadge';
import NailTechBadge from '../NailTechBadge';

interface SlotItemProps {
  time: string;
  status: BookingStatus;
  slotType?: 'regular' | 'with_squeeze_fee' | null;
  nailTechName?: string;
  nailTechRole?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientSocialMediaName?: string;
  service?: string;
  isHidden?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export default function SlotItem({
  time,
  status,
  slotType,
  nailTechName,
  nailTechRole,
  clientName,
  clientEmail,
  clientPhone,
  clientSocialMediaName,
  service,
  isHidden = false,
  onView,
  onEdit,
  onCancel,
}: SlotItemProps) {
  const canDeleteSlot = ['available', 'cancelled', 'CANCELLED', 'no_show', 'NO_SHOW'].includes(status);
  const canEditSlot = ['available', 'blocked', 'cancelled', 'CANCELLED', 'no_show', 'NO_SHOW'].includes(status);

  return (
    <div className={`card mb-2 ${isHidden ? 'border-warning' : ''}`}>
      <div className="card-body py-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="fw-semibold" style={{ minWidth: '70px', flexShrink: 0 }}>
              {time}
            </div>
            <StatusBadge status={status} />
            {slotType === 'with_squeeze_fee' && (
              <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>
                Squeeze-in Fee
              </span>
            )}
            {isHidden && (
              <span className="badge bg-gray-500 text-white" style={{ fontSize: '0.7rem' }}>
                <EyeOff className="me-1" style={{ display: 'inline', width: '14px', height: '14px' }} />Hidden from Clients
              </span>
            )}
            {nailTechName && (
              <NailTechBadge name={nailTechName} />
            )}
            {clientName && (
              <div>
                <div className="fw-semibold small">{clientName}</div>
                {service && <div className="text-muted small">{service}</div>}
                {clientEmail && <div className="text-muted small">{clientEmail}</div>}
                {clientPhone && <div className="text-muted small">{clientPhone}</div>}
                {clientSocialMediaName && <div className="text-muted small">{clientSocialMediaName}</div>}
              </div>
            )}
          </div>
          {/* Show action buttons for both booked and available slots */}
          <div className="d-flex gap-2">
            {['booked', 'pending', 'PENDING_PAYMENT', 'confirmed', 'CONFIRMED', 'no_show', 'NO_SHOW'].includes(status) && onView && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={onView}
                title="View details"
              >
                <Eye size={16} />
              </button>
            )}
            {(onEdit && canEditSlot) && (
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={onEdit}
                title="Edit slot"
              >
                <Pencil size={16} />
              </button>
            )}
            {canDeleteSlot && onCancel && (
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={onCancel}
                title="Delete slot"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
