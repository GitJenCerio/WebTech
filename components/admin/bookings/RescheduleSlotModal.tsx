'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Calendar } from '@/components/ui/Calendar';
import { cn } from '@/components/ui/Utils';
import { useNailTechs } from '@/lib/hooks/useNailTechs';
import { formatTime12Hour } from '@/lib/utils';
import { normalizeSlotTime } from '@/lib/constants/slots';
import { getRequiredSlotCountForService } from '@/lib/serviceSlotCount';
import { mapServiceToStandardDisplay } from '@/lib/serviceLabels';
import type { ServiceType } from '@/lib/types';

const BOOKED_STATUSES = ['pending', 'confirmed'] as const;

const SERVICE_TYPES: ServiceType[] = [
  'Manicure',
  'Pedicure',
  'Manicure + Pedicure',
  'Mani + Pedi Express',
  'Manicure for 2',
  'Pedicure for 2',
  'Manicure for 2 or more',
  'Pedicure for 2 or more',
  'Manicure + Pedicure for 1',
  'Manicure + Pedicure for 2',
  'Manicure + Pedicure for 2 or more',
];

interface Slot {
  _id: string;
  date: string;
  time: string;
  status: string;
  nailTechId: string;
}

interface RescheduleSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  nailTechId: string;
  /** Current service type (enables change-service in modal) */
  currentService?: string;
  /** Current service location (for slot count calc) */
  currentServiceLocation?: 'homebased_studio' | 'home_service';
  /** Optional reason for the reschedule (can be collected in-modal or passed in). */
  reason?: string;
  onConfirm: (newSlotIds: string[], reason?: string, service?: { type: string; location?: string; clientType?: string }) => Promise<void>;
  isLoading?: boolean;
}

export default function RescheduleSlotModal({
  open,
  onOpenChange,
  bookingId,
  nailTechId: initialNailTechId,
  currentService,
  currentServiceLocation,
  reason,
  onConfirm,
  isLoading = false,
}: RescheduleSlotModalProps) {
  const { nailTechs, loading: nailTechsLoading } = useNailTechs();
  const [date, setDate] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [nailTechId, setNailTechId] = useState(initialNailTechId);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const hasBookedBetween = useCallback((slots: Slot[], timeA: string, timeB: string) => {
    const na = normalizeSlotTime(timeA);
    const nb = normalizeSlotTime(timeB);
    return slots.some((s) => {
      const nt = normalizeSlotTime(s.time);
      return nt > na && nt < nb && (BOOKED_STATUSES as readonly string[]).includes(s.status);
    });
  }, []);

  const findNextConsecutiveAvailable = useCallback((slots: Slot[], avail: Slot[], fromSlot: Slot, count: number): Slot[] => {
    if (count <= 0) return [];
    const result: Slot[] = [fromSlot];
    const sortedAvail = [...avail].sort((a, b) => normalizeSlotTime(a.time).localeCompare(normalizeSlotTime(b.time)));
    let ref = fromSlot;
    for (let i = 1; i < count; i++) {
      const refTime = normalizeSlotTime(ref.time);
      const next = sortedAvail.find((s) => {
        const st = normalizeSlotTime(s.time);
        return st > refTime && !hasBookedBetween(slots, ref.time, s.time);
      });
      if (!next) return [];
      result.push(next);
      ref = next;
    }
    return result;
  }, [hasBookedBetween]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>(mapServiceToStandardDisplay(currentService));
  const [reasonText, setReasonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requiredSlots = useMemo(
    () => getRequiredSlotCountForService(selectedServiceType, currentServiceLocation || 'homebased_studio'),
    [selectedServiceType, currentServiceLocation]
  );

  const compatibleSlots = useMemo(() => {
    if (requiredSlots <= 1) return availableSlots;
    return availableSlots.filter((slot) => {
      const chain = findNextConsecutiveAvailable(allSlots, availableSlots, slot, requiredSlots);
      return chain.length >= requiredSlots;
    });
  }, [availableSlots, allSlots, requiredSlots, findNextConsecutiveAvailable]);

  const selectedSlotIds = useMemo(() => {
    if (!selectedSlotId || availableSlots.length === 0) return [];
    const first = availableSlots.find((s) => String(s._id ?? (s as { id?: string }).id) === selectedSlotId);
    if (!first) return [];
    if (requiredSlots === 1) return [String(first._id ?? (first as { id?: string }).id)];
    const chain = findNextConsecutiveAvailable(allSlots, availableSlots, first, requiredSlots);
    return chain.map((s) => String(s._id ?? (s as { id?: string }).id));
  }, [selectedSlotId, availableSlots, allSlots, requiredSlots, findNextConsecutiveAvailable]);

  const fetchSlots = useCallback(async () => {
    if (!nailTechId || !date) {
      setAllSlots([]);
      setAvailableSlots([]);
      setSelectedSlotId('');
      return;
    }
    try {
      setLoadingSlots(true);
      setError(null);
      const params = new URLSearchParams({
        nailTechId,
        startDate: date,
        endDate: date,
      });
      const res = await fetch(`/api/slots?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      const slots = data.slots ?? [];
      setAllSlots(slots);
      setAvailableSlots(slots.filter((s: Slot) => s.status === 'available'));
      setSelectedSlotId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
      setAllSlots([]);
      setAvailableSlots([]);
      setSelectedSlotId('');
    } finally {
      setLoadingSlots(false);
    }
  }, [nailTechId, date]);

  useEffect(() => {
    if (open) {
      setNailTechId(initialNailTechId);
      setDate('');
      setDatePickerOpen(false);
      setAllSlots([]);
      setAvailableSlots([]);
      setSelectedSlotId('');
      setSelectedServiceType(mapServiceToStandardDisplay(currentService));
      setReasonText('');
      setError(null);
    }
  }, [open, initialNailTechId, currentService]);

  useEffect(() => {
    if (open && nailTechId && date) {
      fetchSlots();
    } else {
      setAllSlots([]);
      setAvailableSlots([]);
      setSelectedSlotId('');
    }
  }, [open, nailTechId, date, fetchSlots]);

  const handleConfirm = async () => {
    if (selectedSlotIds.length === 0) return;
    setError(null);
    try {
      const mappedCurrent = mapServiceToStandardDisplay(currentService);
      const servicePayload = selectedServiceType !== mappedCurrent
        ? { type: selectedServiceType, location: currentServiceLocation, clientType: 'repeat' as const }
        : undefined;
      await onConfirm(selectedSlotIds, reasonText.trim() || undefined, servicePayload);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule');
    }
  };

  const selectedDate = date ? new Date(date) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Reschedule & change service</DialogTitle>
          <DialogDescription>
            Optionally change the service, then select a new date and time. Current slots will be released.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-4 py-4 pr-1">
          <div>
            <Label className="text-xs text-gray-500">Service type</Label>
              <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s} {getRequiredSlotCountForService(s, currentServiceLocation) > 1 ? `(${getRequiredSlotCountForService(s, currentServiceLocation)} slots)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {requiredSlots > 1 && (
                <p className="text-xs text-gray-500 mt-1">Select the first slot — {requiredSlots} consecutive slots (no slots booked in between) will be reserved.</p>
              )}
            </div>
          <div>
            <Label className="text-xs text-gray-500">Nail tech</Label>
            <Select value={nailTechId} onValueChange={setNailTechId} disabled={nailTechsLoading}>
              <SelectTrigger className="h-9 mt-1">
                <SelectValue placeholder="Select nail tech" />
              </SelectTrigger>
              <SelectContent>
                {nailTechs.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Date *</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-2 w-full mt-1 min-w-[120px] rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] transition-all h-9 px-3 text-sm',
                    'hover:border-[#1a1a1a]/30 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]'
                  )}
                >
                  <CalendarIcon className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="truncate">{date ? format(new Date(date), 'MMM d, yyyy') : 'Pick date'}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="admin-date-picker-popover w-auto p-0 rounded-2xl border-[#e5e5e5] shadow-lg bg-white"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                  if (d) {
                    setDate(format(d, 'yyyy-MM-dd'));
                    setDatePickerOpen(false);
                  }
                }}
                  defaultMonth={selectedDate || new Date()}
                  disabled={(d) => d < today}
                  numberOfMonths={1}
                  navLayout="around"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Reason (optional)</Label>
            <input
              type="text"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="e.g. Client requested different date"
              className="flex h-9 w-full mt-1 rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] px-3 text-sm text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]"
            />
          </div>
          {date && nailTechId && (
            <div>
              <Label className="text-xs text-gray-500">Available time *</Label>
              {requiredSlots > 1 && (
                <p className="text-xs text-gray-500 mt-0.5">Select the first slot — {requiredSlots} consecutive slots (no slots booked in between) will be reserved.</p>
              )}
              {loadingSlots ? (
                <p className="text-sm text-gray-500 mt-1">Loading slots...</p>
              ) : compatibleSlots.length === 0 ? (
                <p className="text-sm text-amber-600 mt-1">
                  {requiredSlots > 1 ? `No ${requiredSlots} consecutive slots (no slots booked in between) available for this date` : 'No available slots for this date'}
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {compatibleSlots.map((slot) => {
                      const slotId = String(slot._id ?? (slot as { id?: string }).id ?? '');
                      const isSelected = selectedSlotIds.includes(slotId);
                      const isFirstOfSelection = selectedSlotId === slotId;
                      return (
                        <button
                          key={slotId}
                          type="button"
                          onClick={() => setSelectedSlotId(isFirstOfSelection ? '' : slotId)}
                          className={`h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white'
                              : 'border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a]'
                          }`}
                        >
                          <span className="whitespace-nowrap">{formatTime12Hour(slot.time)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {requiredSlots > 1 && selectedSlotIds.length > 0 && selectedSlotIds.length < requiredSlots && (
                    <p className="text-xs text-amber-600 mt-1">Need {requiredSlots - selectedSlotIds.length} more consecutive slot(s) (no slots booked in between). Choose a different time.</p>
                  )}
                </>
              )}
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t border-gray-100 pt-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedSlotIds.length === 0 || selectedSlotIds.length < requiredSlots || isLoading}
            loading={isLoading}
          >
            {selectedSlotIds.length > 0 && selectedSlotIds.length < requiredSlots
              ? `Select ${requiredSlots - selectedSlotIds.length} more slot(s)`
              : 'Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
