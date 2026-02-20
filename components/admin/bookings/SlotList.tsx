import React from 'react';
import SlotItem from './SlotItem';
import { BookingStatus } from '../StatusBadge';

interface Slot {
  id: string;
  time: string;
  status: BookingStatus;
  slotType?: 'regular' | 'with_squeeze_fee' | null;
  nailTechId?: string;
  nailTechName?: string;
  nailTechRole?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientSocialMediaName?: string;
  service?: string;
  isHidden?: boolean;
}

interface SlotListProps {
  date: Date;
  slots: Slot[];
  onSlotClick?: (slot: Slot) => void;
  onView?: (slot: Slot) => void;
  onEdit?: (slot: Slot) => void;
  onCancel?: (slot: Slot) => void;
}

export default function SlotList({
  date,
  slots,
  onSlotClick,
  onView,
  onEdit,
  onCancel,
}: SlotListProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div 
      className="card h-100 d-flex flex-column mb-0"
      style={{
        borderRadius: '24px',
        border: 'none',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        background: '#ffffff',
        overflow: 'visible'
      }}
    >
      <div 
        className="card-header"
        style={{
          background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '24px 24px 0 0',
          padding: '1rem 1.25rem'
        }}
      >
        <h5 className="mb-0" style={{ fontWeight: 600, color: '#212529' }}>Slots for {formatDate(date)}</h5>
      </div>
      <div 
        className="card-body flex-grow-1 min-h-0 overflow-auto slot-list-body"
        style={{
          background: '#ffffff',
          borderRadius: '0 0 24px 24px',
          padding: '1rem 1.25rem'
        }}
      >
        {slots.length === 0 ? (
          <div className="text-center text-muted py-4">
            No slots available for this date
          </div>
        ) : (
          <div>
            {slots.map((slot) => (
              <SlotItem
                key={slot.id}
                time={slot.time}
                status={slot.status}
                slotType={slot.slotType}
                nailTechId={slot.nailTechId}
                nailTechName={slot.nailTechName}
                nailTechRole={slot.nailTechRole}
                clientName={slot.clientName}
                clientEmail={slot.clientEmail}
                clientPhone={slot.clientPhone}
                clientSocialMediaName={slot.clientSocialMediaName}
                service={slot.service}
                isHidden={slot.isHidden}
                onView={() => onView?.(slot)}
                onEdit={() => onEdit?.(slot)}
                onCancel={() => onCancel?.(slot)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
