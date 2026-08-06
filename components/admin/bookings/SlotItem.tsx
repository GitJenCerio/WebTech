import React from 'react';
import { EyeOff } from 'lucide-react';
import StatusBadge, { BookingStatus } from '../StatusBadge';
import NailTechBadge from '../NailTechBadge';
import { formatTime12Hour } from '@/lib/utils';
import { getSlotServiceDisplay } from '@/lib/serviceLabels';
import { isManiPediExpressDualFromParts } from '@/lib/utils/bookingInvoice';

const SERVICE_BADGE_STYLE: React.CSSProperties = {
  backgroundColor: '#f0ebe4',
  color: '#3d342c',
  border: '1px solid #c4b5a0',
};

/** Short labels for slot badges (Mani, Pedi, Mani + Pedi) */
function getServiceBadge(service?: string): { label: string; style: React.CSSProperties } | null {
  if (!service || !service.trim()) return null;
  const full = getSlotServiceDisplay(service);
  const label = full === 'Manicure + Pedicure for 2' ? 'Mani + Pedi (2)' : full === 'Manicure + Pedicure for 1' ? 'Mani + Pedi (1)' : full.replace('Manicure', 'Mani').replace('Pedicure', 'Pedi');
  return { label, style: SERVICE_BADGE_STYLE };
}

interface SlotItemProps {
  time: string;
  status: BookingStatus;
  slotType?: 'regular' | 'with_squeeze_fee' | null;
  nailTechId?: string;
  nailTechName?: string;
  primaryNailTechId?: string;
  secondaryNailTechId?: string;
  secondaryNailTechName?: string;
  nailTechRole?: string;
  serviceLocation?: 'homebased_studio' | 'home_service';
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientSocialMediaName?: string;
  service?: string;
  serviceMode?: 'single_tech' | 'simultaneous_two_techs';
  /** Express pair role for this slot's booking doc */
  expressSegment?: 'manicure' | 'pedicure' | null;
  expressGroupId?: string | null;
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
  primaryNailTechId,
  secondaryNailTechId,
  secondaryNailTechName,
  nailTechRole: _nailTechRole,
  serviceLocation,
  clientName,
  clientEmail,
  clientPhone,
  clientSocialMediaName,
  service,
  serviceMode,
  expressSegment,
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

  const isSimultaneous = isManiPediExpressDualFromParts(
    service,
    secondaryNailTechId,
    serviceMode ?? null
  );

  /** Batch badge: same combined label on both simultaneous slot cards */
  const serviceBadge = isSimultaneous
    ? { label: 'Mani+Pedi Express', style: SERVICE_BADGE_STYLE }
    : getServiceBadge(service);

  const expressTechSuffix =
    expressSegment === 'manicure'
      ? ' (Manicure)'
      : expressSegment === 'pedicure'
        ? ' (Pedicure)'
        : String(nailTechId) === String(primaryNailTechId)
          ? ' (Manicure)'
          : String(nailTechId) === String(secondaryNailTechId)
            ? ' (Pedicure)'
            : '';

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && handleClick() : undefined}
      className={`card mb-2 ${isHidden ? 'border-warning' : ''} ${isClickable ? 'cursor-pointer' : ''} ${['confirmed', 'CONFIRMED'].includes(status) ? 'slot-card-confirmed' : ''} ${['pending', 'PENDING_PAYMENT'].includes(status) ? 'slot-card-pending' : ''}`}
      style={{
        borderRadius: 0,
        border: isHidden ? '2px solid #c4b5a0' : '1px solid #e7e2db',
        boxShadow: 'none',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#c4b5a0';
        e.currentTarget.style.backgroundColor = '#fffcfa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isHidden ? '#c4b5a0' : '#e7e2db';
        e.currentTarget.style.backgroundColor = '';
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
            color: '#5c4a32',
            backgroundColor: '#efe6d8',
            border: '1px solid #c4b5a0',
            borderTop: 'none',
            borderRight: 'none',
            borderRadius: 0,
            zIndex: 1,
          }}
        >
          SQ
        </span>
      )}
      {['confirmed', 'CONFIRMED', 'completed', 'COMPLETED'].includes(status) && serviceLocation && (
        <span
          title={serviceLocation === 'home_service' ? 'Home Service' : 'Studio'}
          className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[0.45rem] sm:text-[0.55rem] font-bold z-[1] border-b-0 border-r-0"
          style={{
            backgroundColor: serviceLocation === 'home_service' ? '#efe6d8' : '#e7e2db',
            color: serviceLocation === 'home_service' ? '#5c4a32' : '#3d342c',
            borderWidth: '1px',
            borderColor: serviceLocation === 'home_service' ? '#c4b5a0' : '#a8a29e',
            borderRadius: 0,
          }}
        >
          {serviceLocation === 'home_service' ? 'HS' : 'ST'}
        </span>
      )}
      <div 
        className="card-body py-2"
        style={{
          borderRadius: 0,
          paddingTop: '0.75rem',
          paddingBottom: ['confirmed', 'CONFIRMED', 'completed', 'COMPLETED'].includes(status) && serviceLocation ? '1.5rem' : '0.75rem',
          paddingLeft: '1rem',
          paddingRight: slotType === 'with_squeeze_fee' ? '2rem' : '1rem',
        }}
      >
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div style={{ flex: 1 }}>
            <div className="d-flex flex-column gap-1">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div className="fw-semibold whitespace-nowrap" style={{ minWidth: '70px', flexShrink: 0 }}>
                  {formatTime12Hour(time)}
                </div>
                <StatusBadge status={status} className="!text-[10px] !px-2 !py-0.5 sm:!text-xs sm:!px-2.5 sm:!py-0.5" />
                {serviceBadge && (
                  <span
                    className="inline-flex items-center justify-center rounded-none px-2 py-0.5 text-[10px] sm:text-xs font-medium min-h-[20px] sm:min-h-[24px] box-border sm:px-2.5"
                    style={{ ...serviceBadge.style }}
                  >
                    {serviceBadge.label}
                  </span>
                )}
                {isHidden && (
                  <span
                    className="inline-flex items-center justify-center gap-1 rounded-none px-2.5 py-0.5 text-xs font-medium min-h-[24px] box-border border border-[#e7e2db]"
                    style={{ backgroundColor: '#e7e2db', color: '#78716c' }}
                  >
                    <EyeOff style={{ width: '12px', height: '12px', flexShrink: 0 }} />Hidden from Clients
                  </span>
                )}
                {nailTechName && !isSimultaneous && (
                  <NailTechBadge name={nailTechName} nailTechId={nailTechId} />
                )}
                {isSimultaneous && nailTechName && nailTechId && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium" style={{ color: '#3d342c' }}>
                    <NailTechBadge name={`${nailTechName}${expressTechSuffix}`} nailTechId={nailTechId} />
                  </span>
                )}
              </div>
              {clientName && (
                <div className="text-muted small fw-semibold">{clientName}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
