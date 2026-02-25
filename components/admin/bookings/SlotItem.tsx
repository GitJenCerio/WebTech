import React from 'react';
import { EyeOff } from 'lucide-react';
import StatusBadge, { BookingStatus } from '../StatusBadge';
import NailTechBadge from '../NailTechBadge';

const SERVICE_BADGE_STYLE: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
};

/** Map API service type to display label for slot service badge */
const SERVICE_LABELS: Record<string, string> = {
  manicure: 'Mani',
  pedicure: 'Pedi',
  mani_pedi: 'Mani + Pedi',
  home_service_2slots: 'Mani + Pedi (2)',
  home_service_3slots: 'Mani + Pedi (3)',
};

function getServiceBadge(service?: string): { label: string; style: React.CSSProperties } | null {
  if (!service || !service.trim()) return null;
  const key = service.toLowerCase().trim().replace(/\s+/g, '_');
  let label = SERVICE_LABELS[key];
  if (!label) {
    if (key.includes('mani') && key.includes('pedi')) label = 'Mani + Pedi';
    else if (key.includes('manicure') || key === 'mani') label = 'Mani';
    else if (key.includes('pedicure') || key === 'pedi') label = 'Pedi';
    else label = service.trim();
  }
  return { label, style: SERVICE_BADGE_STYLE };
}

interface SlotItemProps {
  time: string;
  status: BookingStatus;
  slotType?: 'regular' | 'with_squeeze_fee' | null;
  nailTechId?: string;
  nailTechName?: string;
  nailTechRole?: string;
  serviceLocation?: 'homebased_studio' | 'home_service';
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
  nailTechId,
  nailTechName,
  nailTechRole: _nailTechRole,
  serviceLocation,
  clientName,
  clientEmail,
  clientPhone,
  clientSocialMediaName,
  service,
  isHidden = false,
  onView,
  onEdit,
  onCancel: _onCancel,
}: SlotItemProps) {
  const canEditSlot = ['available', 'blocked', 'cancelled', 'CANCELLED', 'no_show', 'NO_SHOW'].includes(status);
  const canViewSlot = ['booked', 'pending', 'PENDING_PAYMENT', 'confirmed', 'CONFIRMED', 'completed', 'COMPLETED', 'no_show', 'NO_SHOW'].includes(status);
  const handleClick = () => {
    if (canViewSlot && onView) onView();
    else if (canEditSlot && onEdit) onEdit();
  };
  const isClickable = (canViewSlot && onView) || (canEditSlot && onEdit);

  const serviceBadge = getServiceBadge(service);

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && handleClick() : undefined}
      className={`card mb-2 ${isHidden ? 'border-warning' : ''} ${isClickable ? 'cursor-pointer' : ''}`}
      style={{
        borderRadius: '20px',
        border: isHidden ? '2px solid #ffc107' : '1px solid #ced4da',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        background: '#ffffff',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(0, 0, 0, 0.04)';
      }}
    >
      {slotType === 'with_squeeze_fee' && (
        <span
          title="Squeeze-in Fee"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.55rem',
            fontWeight: 700,
            color: '#5b21b6',
            backgroundColor: '#ede9fe',
            border: '1px solid #c4b5fd',
            borderTop: 'none',
            borderRight: 'none',
            borderRadius: '0 0 0 8px',
            zIndex: 1,
          }}
        >
          SQ
        </span>
      )}
      {['confirmed', 'CONFIRMED', 'completed', 'COMPLETED'].includes(status) && serviceLocation && (
        <span
          title={serviceLocation === 'home_service' ? 'Home Service' : 'Studio'}
          className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[0.45rem] sm:text-[0.55rem] font-bold z-[1] border-b-0 border-r-0 rounded-tl-lg"
          style={{
            backgroundColor: serviceLocation === 'home_service' ? '#fef3c7' : '#dbeafe',
            color: serviceLocation === 'home_service' ? '#92400e' : '#1e40af',
            borderWidth: '1px',
            borderColor: serviceLocation === 'home_service' ? '#fcd34d' : '#93c5fd',
          }}
        >
          {serviceLocation === 'home_service' ? 'HS' : 'ST'}
        </span>
      )}
      <div 
        className="card-body py-2"
        style={{
          borderRadius: '20px',
          paddingTop: '0.75rem',
          paddingBottom: ['confirmed', 'CONFIRMED', 'completed', 'COMPLETED'].includes(status) && serviceLocation ? '1.5rem' : '0.75rem',
          paddingLeft: '1rem',
          paddingRight: slotType === 'with_squeeze_fee' ? '2rem' : '1rem',
        }}
      >
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div style={{ flex: 1 }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="fw-semibold" style={{ minWidth: '70px', flexShrink: 0 }}>
                {time}
              </div>
              <StatusBadge status={status} className="!text-[10px] !px-2 !py-0.5 sm:!text-xs sm:!px-2.5 sm:!py-0.5" />
              {serviceBadge && (
                <span
                  className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium min-h-[20px] sm:min-h-[24px] box-border sm:px-2.5"
                  style={{ ...serviceBadge.style }}
                >
                  {serviceBadge.label}
                </span>
              )}
              {isHidden && (
                <span
                  className="inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium min-h-[24px] box-border border border-transparent text-white"
                  style={{ backgroundColor: '#6c757d' }}
                >
                  <EyeOff style={{ width: '12px', height: '12px', flexShrink: 0 }} />Hidden from Clients
                </span>
              )}
              {nailTechName && (
                <NailTechBadge name={nailTechName} nailTechId={nailTechId} />
              )}
              {clientName && (
                <span className="text-muted small fw-semibold">{clientName}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
