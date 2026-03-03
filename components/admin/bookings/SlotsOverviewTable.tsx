'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { SLOT_TIMES, normalizeSlotTime } from '@/lib/constants/slots';
import { getChosenServicesDisplay, getSlotServiceDisplay } from '@/lib/serviceLabels';
import { formatTime12Hour } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useNailTechs } from '@/lib/hooks/useNailTechs';

interface Slot {
  id: string;
  date?: string;
  time: string;
  status: string;
  type?: 'regular' | 'with_squeeze_fee';
  isHidden?: boolean;
  nailTechId?: string;
  nailTechName?: string;
  clientName?: string;
  service?: string;
  booking?: {
    id?: string;
    bookingCode?: string;
    status?: string;
    paymentStatus?: string;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerSocialMediaName?: string;
    slotIds?: string[];
    service?: { type?: string; location?: 'homebased_studio' | 'home_service'; chosenServices?: string[] };
    pricing?: { total?: number; depositRequired?: number; paidAmount?: number };
    payment?: { paymentProofUrl?: string };
    clientNotes?: string;
    adminNotes?: string;
    clientPhotos?: {
      inspiration?: Array<{ url?: string }>;
      currentState?: Array<{ url?: string }>;
    };
    invoice?: { quotationId?: string; total?: number; createdAt?: string } | null;
    completedAt?: string | null;
    [key: string]: unknown;
  } | null;
}

interface SlotsOverviewTableProps {
  currentMonth: Date;
  showNailTechFilter?: boolean;
  onSlotClick?: (slot: Slot, slotTimes: string[]) => void;
}

function mapApiSlotToViewSlot(slot: any, nailTechs: { id: string; name: string }[]): Slot {
  const mapStatus = (s: any) => {
    if (s.status === 'available') return 'available';
    if (s.status === 'blocked') return 'blocked';
    if (s.booking?.status === 'completed' || s.booking?.completedAt) return 'completed';
    if (s.booking?.status === 'pending') return 'PENDING_PAYMENT';
    if (s.booking?.status === 'confirmed') return 'CONFIRMED';
    if (s.booking?.status === 'cancelled') return 'CANCELLED';
    if (s.booking?.status === 'no_show') return 'NO_SHOW';
    if (s.status === 'confirmed') return 'CONFIRMED';
    if (s.status === 'pending') return 'pending';
    return 'booked';
  };
  return {
    id: slot.id || slot._id,
    date: slot.date,
    time: slot.time,
    status: mapStatus(slot),
    type: slot.slotType,
    isHidden: slot.isHidden || false,
    nailTechId: slot.nailTechId,
    nailTechName: nailTechs.find((t) => t.id === slot.nailTechId)?.name,
    clientName: slot.booking?.customerName,
    service: slot.booking?.service?.type,
    booking: slot.booking
      ? {
          id: slot.booking.id,
          bookingCode: slot.booking.bookingCode,
          status: slot.booking.status,
          paymentStatus: slot.booking.paymentStatus,
          customerId: slot.booking.customerId,
          customerName: slot.booking.customerName,
          customerEmail: slot.booking.customerEmail,
          customerPhone: slot.booking.customerPhone,
          customerSocialMediaName: slot.booking.customerSocialMediaName,
          slotIds: slot.booking.slotIds,
          service: slot.booking.service,
          pricing: slot.booking.pricing,
          payment: slot.booking.payment,
          clientNotes: slot.booking.clientNotes,
          adminNotes: slot.booking.adminNotes,
          clientPhotos: slot.booking.clientPhotos,
          invoice: slot.booking.invoice,
          completedAt: slot.booking.completedAt,
        }
      : null,
  };
}

function serviceLocationLabel(loc?: 'homebased_studio' | 'home_service') {
  if (loc === 'home_service') return 'HS';
  if (loc === 'homebased_studio') return 'ST';
  return '—';
}

const PhotoLinksCell = ({ urls }: { urls: Array<{ url?: string }> | undefined }) => {
  const list = urls?.filter((u) => u?.url) ?? [];
  if (list.length === 0) return <span>—</span>;
  return (
    <span className="flex flex-wrap gap-x-2 gap-y-0.5">
      {list.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#1a1a1a] underline hover:no-underline font-medium"
        >
          {list.length > 1 ? `View ${i + 1}` : 'View'}
        </a>
      ))}
    </span>
  );
};

export default function SlotsOverviewTable({ currentMonth, showNailTechFilter = true, onSlotClick }: SlotsOverviewTableProps) {
  const { nailTechs, loading: nailTechsLoading } = useNailTechs();
  const [tableNailTechId, setTableNailTechId] = useState<string>('all');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlots = useCallback(async () => {
    const mStart = startOfMonth(currentMonth);
    const mEnd = endOfMonth(currentMonth);
    const startDate = format(mStart, 'yyyy-MM-dd');
    const endDate = format(mEnd, 'yyyy-MM-dd');
    const params = new URLSearchParams({ startDate, endDate });
    if (tableNailTechId && tableNailTechId !== 'all') {
      params.append('nailTechId', tableNailTechId);
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/slots?${params}`);
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      setSlots((data.slots || []).map((s: any) => mapApiSlotToViewSlot(s, nailTechs)));
    } catch (e) {
      console.error('SlotsOverviewTable fetch error:', e);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, tableNailTechId, nailTechs]);

  useEffect(() => {
    if (!nailTechsLoading) fetchSlots();
  }, [fetchSlots, nailTechsLoading]);

  const slotsList = useMemo(() => {
    const mStart = startOfMonth(currentMonth);
    const mEnd = endOfMonth(currentMonth);
    const mDays = eachDayOfInterval({ start: mStart, end: mEnd }).map((d) => format(d, 'yyyy-MM-dd'));

    const list: Array<{ dateStr: string; time: string; slot: Slot }> = [];
    mDays.forEach((dateStr) => {
      SLOT_TIMES.forEach((time) => {
        const matching = slots.filter((s) => s.date === dateStr && normalizeSlotTime(s.time) === time);
        matching.forEach((slot) => list.push({ dateStr, time, slot }));
      });
    });
    return list;
  }, [slots, currentMonth]);

  const isEmpty = slotsList.length === 0 && !loading;

  return (
    <Card className="w-full max-w-full mt-6 border border-[#e5e5e5] rounded-2xl bg-white shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Lato', sans-serif" }}>
            Slots Overview — {format(currentMonth, 'MMMM yyyy')}
          </h3>
          {showNailTechFilter && nailTechs.length > 0 && (
            <Select value={tableNailTechId} onValueChange={setTableNailTechId}>
              <SelectTrigger className="h-9 w-[140px] shrink-0 text-xs px-3 rounded-xl border border-[#e5e5e5]">
                <SelectValue placeholder="All Nail Techs" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all" className="text-xs">All Nail Techs</SelectItem>
                {nailTechs.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id} className="text-xs">
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a1a1a] border-t-transparent" role="status" aria-label="Loading" />
          </div>
        ) : isEmpty ? (
          <p className="text-sm text-gray-500 py-8 text-center" style={{ fontFamily: "'Lato', sans-serif" }}>
            No slots in this period.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
            <table className="w-full text-xs border-collapse min-w-[800px]" style={{ fontFamily: "'Lato', sans-serif" }}>
              <thead>
                <tr className="bg-[#f8f9fa]">
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 uppercase tracking-wider border-b border-[#e5e5e5]">Date & Time</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 uppercase tracking-wider border-b border-[#e5e5e5]">Nail Tech</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 uppercase tracking-wider border-b border-[#e5e5e5]">Status</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 uppercase tracking-wider border-b border-[#e5e5e5]">Client</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 uppercase tracking-wider border-b border-[#e5e5e5]">Service</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 uppercase tracking-wider border-b border-[#e5e5e5]">Specific</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 uppercase tracking-wider border-b border-[#e5e5e5]">Location</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 uppercase tracking-wider border-b border-[#e5e5e5]">Current</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 uppercase tracking-wider border-b border-[#e5e5e5]">Inspo</th>
                </tr>
              </thead>
              <tbody>
                {slotsList.map(({ dateStr, time, slot }, idx) => {
                  const dateTimeLabel = `${format(new Date(dateStr), 'MMM d, yyyy')} ${formatTime12Hour(time)}`;
                  const isAvail = slot.status === 'available';
                  const isBooked = ['booked', 'confirmed', 'CONFIRMED', 'pending', 'PENDING_PAYMENT', 'completed', 'COMPLETED'].includes(slot.status);
                  const statusLabel = isAvail ? 'Available' : isBooked ? 'Booked' : slot.status;
                  const statusBg = isAvail ? '#d4edda' : '#fff3cd';
                  const statusColor = isAvail ? '#155724' : '#856404';
                  const svc = slot.booking?.service;
                  const serviceType = svc?.type ? getSlotServiceDisplay(svc.type) : '—';
                  const specific = svc?.chosenServices?.length ? getChosenServicesDisplay(svc.chosenServices) : '—';
                  const clientName = slot.clientName || slot.booking?.customerName || '—';
                  const location = serviceLocationLabel(svc?.location);
                  const photos = slot.booking?.clientPhotos || {};
                  const currentUrls = photos.currentState ?? [];
                  const inspoUrls = photos.inspiration ?? [];
                  const isClickable = !!(slot.booking?.id && slot.clientName);
                  const slotTimes = slots
                    .filter((s) => s.booking?.id === slot.booking?.id)
                    .map((s) => s.time)
                    .filter(Boolean)
                    .sort((a, b) => (a || '').localeCompare(b || '', undefined, { numeric: true }));

                  const handleRowClick = () => {
                    if (isClickable && onSlotClick) onSlotClick(slot, slotTimes);
                  };

                  return (
                    <tr
                      key={slot.id || `${dateStr}-${time}-${idx}`}
                      onClick={handleRowClick}
                      className={`border-b border-[#e5e5e5] transition-colors ${
                        isClickable ? 'cursor-pointer hover:bg-gray-100' : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap text-gray-900">{dateTimeLabel}</td>
                      <td className="py-2.5 px-3 text-gray-900">{slot.nailTechName || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span style={{ backgroundColor: statusBg, color: statusColor, fontWeight: 500 }} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px]">
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-900">{clientName}</td>
                      <td className="py-2.5 px-3 text-gray-900">{serviceType}</td>
                      <td className="py-2.5 px-3 text-gray-900">{specific}</td>
                      <td className="py-2.5 px-3 text-gray-900">{location}</td>
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <PhotoLinksCell urls={currentUrls} />
                      </td>
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <PhotoLinksCell urls={inspoUrls} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
