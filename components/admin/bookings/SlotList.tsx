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
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Slots for {formatDate(date)}</h5>
      </div>
      <div className="card-body">
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
