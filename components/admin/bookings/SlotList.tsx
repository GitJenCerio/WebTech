import React, { useMemo } from 'react';
import SlotItem from './SlotItem';
import { BookingStatus } from '../StatusBadge';
import { sortSlotsWithPairedBookings } from '@/lib/utils';

interface Slot {
  id: string;
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
  isHidden?: boolean;
  booking?: {
    id?: string;
    bookingCode?: string;
    customerId?: string;
    status?: string;
    [key: string]: unknown;
  } | null;
}

interface SlotListProps {
  date: Date;
  slots: Slot[];
  onSlotClick?: (slot: Slot) => void;
  onView?: (slot: Slot) => void;
  onEdit?: (slot: Slot) => void;
  onCancel?: (slot: Slot) => void;
  /** When true, empty state is due to nail tech filter (e.g. no slots for selected tech on this date). */
  emptyStateFiltered?: boolean;
}

export default function SlotList({
  date,
  slots,
  onSlotClick,
  onView,
  onEdit,
  onCancel,
  emptyStateFiltered = false,
}: SlotListProps) {
  const sortedSlots = useMemo(() => {
    const base = sortSlotsWithPairedBookings(slots);
    // Deterministic ordering for simultaneous Mani+Pedi:
    // primary tech (Manicure) slot card first, secondary tech (Pedicure) second.
    const withIndex = base.map((s, i) => ({ s, i }));
    withIndex.sort((a, b) => {
      const sameBookingId = a.s.booking?.id && b.s.booking?.id && a.s.booking.id === b.s.booking.id;
      const sameTime = a.s.time && b.s.time && a.s.time === b.s.time;
      const isSimA = a.s.service === 'Manicure + Pedicure' && a.s.primaryNailTechId && a.s.secondaryNailTechId;
      const isSimB = b.s.service === 'Manicure + Pedicure' && b.s.primaryNailTechId && b.s.secondaryNailTechId;
      if (sameBookingId && sameTime && isSimA && isSimB) {
        const aIsPrimary = String(a.s.nailTechId) === String(a.s.primaryNailTechId);
        const bIsPrimary = String(b.s.nailTechId) === String(b.s.primaryNailTechId);
        if (aIsPrimary !== bIsPrimary) return aIsPrimary ? -1 : 1;
      }
      return a.i - b.i;
    });
    return withIndex.map((x) => x.s);
  }, [slots]);

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
        <h5 className="mb-0 text-xs sm:text-sm" style={{ fontWeight: 600, color: '#212529' }}>Slots for {formatDate(date)}</h5>
      </div>
      <div 
        className="card-body flex-grow-1 min-h-0 overflow-auto slot-list-body"
        style={{
          background: '#ffffff',
          borderRadius: '0 0 24px 24px',
          padding: '1rem 1.25rem'
        }}
      >
        {sortedSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <p className="text-sm font-medium text-gray-500">
              {emptyStateFiltered ? 'No slots for the selected nail tech on this date.' : 'No slots for this date.'}
            </p>
            <p className="text-xs text-gray-400 max-w-[220px]">
              {emptyStateFiltered ? 'Try another date or select All Techs.' : "Add slots using '+ Add Slot' or select another date."}
            </p>
          </div>
        ) : (
          <div>
            {sortedSlots.map((slot) => (
              <SlotItem
                key={slot.id}
                time={slot.time}
                status={slot.status}
                slotType={slot.slotType}
                nailTechId={slot.nailTechId}
                nailTechName={slot.nailTechName}
                primaryNailTechId={slot.primaryNailTechId}
                secondaryNailTechId={slot.secondaryNailTechId}
                secondaryNailTechName={slot.secondaryNailTechName}
                nailTechRole={slot.nailTechRole}
                serviceLocation={slot.serviceLocation}
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
