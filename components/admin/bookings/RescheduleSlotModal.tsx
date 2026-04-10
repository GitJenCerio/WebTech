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
  currentService?: string;
  currentServiceLocation?: 'homebased_studio' | 'home_service';
  reason?: string;
  onConfirm: (
    newSlotIds: string[],
    reason?: string,
    service?: { type: string; location?: string; clientType?: string; secondaryNailTechId?: string }
  ) => Promise<void>;
  isLoading?: boolean;
}

function isSimultaneousService(serviceType: string): boolean {
  const key = serviceType.toLowerCase().trim();
  return key.includes('express') || key.includes('simultaneous');
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
  const [selectedServiceType, setSelectedServiceType] = useState<string>(
    mapServiceToStandardDisplay(currentService)
  );
  const [reasonText, setReasonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ── Single-tech state ──────────────────────────────────────────
  const [nailTechId, setNailTechId] = useState(initialNailTechId);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState('');

  // ── Dual-tech state (Mani + Pedi Express) ─────────────────────
  const [manicureTechId, setManicureTechId] = useState('');
  const [pedicureTechId, setPedicureTechId] = useState('');
  const [maniSlots, setManiSlots] = useState<Slot[]>([]);
  const [pediSlots, setPediSlots] = useState<Slot[]>([]);
  const [loadingDualSlots, setLoadingDualSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');

  const isSimultaneous = isSimultaneousService(selectedServiceType);

  const requiredSlots = useMemo(
    () => getRequiredSlotCountForService(selectedServiceType, currentServiceLocation || 'homebased_studio'),
    [selectedServiceType, currentServiceLocation]
  );

  // ── Consecutive slot helpers (single-tech) ─────────────────────
  const hasBookedBetween = useCallback(
    (slots: Slot[], timeA: string, timeB: string) => {
      const na = normalizeSlotTime(timeA);
      const nb = normalizeSlotTime(timeB);
      return slots.some((s) => {
        const nt = normalizeSlotTime(s.time);
        return nt > na && nt < nb && (BOOKED_STATUSES as readonly string[]).includes(s.status);
      });
    },
    []
  );

  const findNextConsecutiveAvailable = useCallback(
    (slots: Slot[], avail: Slot[], fromSlot: Slot, count: number): Slot[] => {
      if (count <= 0) return [];
      const result: Slot[] = [fromSlot];
      const sortedAvail = [...avail].sort((a, b) =>
        normalizeSlotTime(a.time).localeCompare(normalizeSlotTime(b.time))
      );
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
    },
    [hasBookedBetween]
  );

  const compatibleSlots = useMemo(() => {
    if (isSimultaneous) return [];
    if (requiredSlots <= 1) return availableSlots;
    return availableSlots.filter((slot) => {
      const chain = findNextConsecutiveAvailable(allSlots, availableSlots, slot, requiredSlots);
      return chain.length >= requiredSlots;
    });
  }, [availableSlots, allSlots, requiredSlots, isSimultaneous, findNextConsecutiveAvailable]);

  const selectedSlotIds = useMemo(() => {
    if (isSimultaneous || !selectedSlotId || availableSlots.length === 0) return [];
    const first = availableSlots.find(
      (s) => String(s._id ?? (s as { id?: string }).id) === selectedSlotId
    );
    if (!first) return [];
    if (requiredSlots === 1) return [String(first._id ?? (first as { id?: string }).id)];
    const chain = findNextConsecutiveAvailable(allSlots, availableSlots, first, requiredSlots);
    return chain.map((s) => String(s._id ?? (s as { id?: string }).id));
  }, [selectedSlotId, availableSlots, allSlots, requiredSlots, isSimultaneous, findNextConsecutiveAvailable]);

  // ── Common times for dual-tech (Mani + Pedi Express) ──────────
  const commonTimes = useMemo(() => {
    if (!isSimultaneous || maniSlots.length === 0 || pediSlots.length === 0) return [];
    const maniTimes = new Set(
      maniSlots.filter((s) => s.status === 'available').map((s) => s.time)
    );
    return pediSlots
      .filter((s) => s.status === 'available' && maniTimes.has(s.time))
      .map((s) => s.time)
      .sort((a, b) => normalizeSlotTime(a).localeCompare(normalizeSlotTime(b)));
  }, [isSimultaneous, maniSlots, pediSlots]);

  // Slot IDs for the chosen common time
  const dualSlotIds = useMemo(() => {
    if (!isSimultaneous || !selectedTime) return [];
    const maniSlot = maniSlots.find((s) => s.time === selectedTime && s.status === 'available');
    const pediSlot = pediSlots.find((s) => s.time === selectedTime && s.status === 'available');
    if (!maniSlot || !pediSlot) return [];
    return [String(maniSlot._id), String(pediSlot._id)];
  }, [isSimultaneous, selectedTime, maniSlots, pediSlots]);

  // ── Fetch slots (single-tech) ──────────────────────────────────
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
      const params = new URLSearchParams({ nailTechId, startDate: date, endDate: date });
      const res = await fetch(`/api/slots?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      const slots: Slot[] = data.slots ?? [];
      setAllSlots(slots);
      setAvailableSlots(slots.filter((s) => s.status === 'available'));
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

  // ── Fetch slots (dual-tech) ────────────────────────────────────
  const fetchDualSlots = useCallback(async () => {
    if (!manicureTechId || !pedicureTechId || !date) {
      setManiSlots([]);
      setPediSlots([]);
      setSelectedTime('');
      return;
    }
    try {
      setLoadingDualSlots(true);
      setError(null);
      const [maniRes, pediRes] = await Promise.all([
        fetch(`/api/slots?${new URLSearchParams({ nailTechId: manicureTechId, startDate: date, endDate: date })}`),
        fetch(`/api/slots?${new URLSearchParams({ nailTechId: pedicureTechId, startDate: date, endDate: date })}`),
      ]);
      if (!maniRes.ok || !pediRes.ok) throw new Error('Failed to fetch slots');
      const [maniData, pediData] = await Promise.all([maniRes.json(), pediRes.json()]);
      setManiSlots(maniData.slots ?? []);
      setPediSlots(pediData.slots ?? []);
      setSelectedTime('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
      setManiSlots([]);
      setPediSlots([]);
      setSelectedTime('');
    } finally {
      setLoadingDualSlots(false);
    }
  }, [manicureTechId, pedicureTechId, date]);

  // ── Reset on open ──────────────────────────────────────────────
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
      setManicureTechId('');
      setPedicureTechId('');
      setManiSlots([]);
      setPediSlots([]);
      setSelectedTime('');
    }
  }, [open, initialNailTechId, currentService]);

  // Reset slot selection when service type changes
  useEffect(() => {
    setSelectedSlotId('');
    setSelectedTime('');
    setManiSlots([]);
    setPediSlots([]);
    setAllSlots([]);
    setAvailableSlots([]);
  }, [selectedServiceType]);

  // Fetch single-tech slots
  useEffect(() => {
    if (open && !isSimultaneous && nailTechId && date) fetchSlots();
    else if (!isSimultaneous) {
      setAllSlots([]);
      setAvailableSlots([]);
      setSelectedSlotId('');
    }
  }, [open, isSimultaneous, nailTechId, date, fetchSlots]);

  // Fetch dual-tech slots
  useEffect(() => {
    if (open && isSimultaneous && manicureTechId && pedicureTechId && date) fetchDualSlots();
    else if (isSimultaneous) {
      setManiSlots([]);
      setPediSlots([]);
      setSelectedTime('');
    }
  }, [open, isSimultaneous, manicureTechId, pedicureTechId, date, fetchDualSlots]);

  // ── Confirm ────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setError(null);
    try {
      const mappedCurrent = mapServiceToStandardDisplay(currentService);
      const serviceChanged = selectedServiceType !== mappedCurrent;

      if (isSimultaneous) {
        if (dualSlotIds.length < 2) return;
        const servicePayload = {
          type: selectedServiceType,
          location: currentServiceLocation,
          clientType: 'repeat' as const,
          secondaryNailTechId: pedicureTechId,
        };
        await onConfirm(dualSlotIds, reasonText.trim() || undefined, servicePayload);
      } else {
        if (selectedSlotIds.length === 0) return;
        const servicePayload = serviceChanged
          ? { type: selectedServiceType, location: currentServiceLocation, clientType: 'repeat' as const }
          : undefined;
        await onConfirm(selectedSlotIds, reasonText.trim() || undefined, servicePayload);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule');
    }
  };

  const selectedDate = date ? new Date(date) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const canConfirm = isSimultaneous
    ? dualSlotIds.length === 2
    : selectedSlotIds.length > 0 && selectedSlotIds.length >= requiredSlots;

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
          {/* Service Type */}
          <div>
            <Label className="text-xs text-gray-500">Service type</Label>
            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
              <SelectTrigger className="h-9 mt-1">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                    {!isSimultaneousService(s) && getRequiredSlotCountForService(s, currentServiceLocation) > 1
                      ? ` (${getRequiredSlotCountForService(s, currentServiceLocation)} slots)`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── SIMULTANEOUS: two nail tech selectors ── */}
          {isSimultaneous ? (
            <>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                Select one nail tech for <strong>Manicure</strong> and a different one for <strong>Pedicure</strong>. Only times where both are available will be shown.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Manicure tech *</Label>
                  <Select
                    value={manicureTechId}
                    onValueChange={(v) => {
                      setManicureTechId(v);
                      if (v === pedicureTechId) setPedicureTechId('');
                    }}
                    disabled={nailTechsLoading}
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="Select tech" />
                    </SelectTrigger>
                    <SelectContent>
                      {nailTechs.map((tech) => (
                        <SelectItem
                          key={tech.id}
                          value={tech.id}
                          disabled={tech.id === pedicureTechId}
                        >
                          Ms. {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Pedicure tech *</Label>
                  <Select
                    value={pedicureTechId}
                    onValueChange={(v) => {
                      setPedicureTechId(v);
                      if (v === manicureTechId) setManicureTechId('');
                    }}
                    disabled={nailTechsLoading}
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="Select tech" />
                    </SelectTrigger>
                    <SelectContent>
                      {nailTechs.map((tech) => (
                        <SelectItem
                          key={tech.id}
                          value={tech.id}
                          disabled={tech.id === manicureTechId}
                        >
                          Ms. {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            /* ── SINGLE TECH ── */
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
              {requiredSlots > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Select the first slot — {requiredSlots} consecutive slots will be reserved.
                </p>
              )}
            </div>
          )}

          {/* Date picker */}
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
                  <span className="truncate">
                    {date ? format(new Date(date), 'MMM d, yyyy') : 'Pick date'}
                  </span>
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

          {/* Reason */}
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

          {/* ── SIMULTANEOUS: common time slots ── */}
          {isSimultaneous && manicureTechId && pedicureTechId && date && (
            <div>
              <Label className="text-xs text-gray-500">Available time *</Label>
              {loadingDualSlots ? (
                <p className="text-sm text-gray-500 mt-1">Loading slots...</p>
              ) : commonTimes.length === 0 ? (
                <p className="text-sm text-amber-600 mt-1">
                  No common available time slots for both techs on this date.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(selectedTime === time ? '' : time)}
                      className={`h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
                        selectedTime === time
                          ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white'
                          : 'border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a]'
                      }`}
                    >
                      <span className="whitespace-nowrap">{formatTime12Hour(time)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SINGLE TECH: slot buttons ── */}
          {!isSimultaneous && date && nailTechId && (
            <div>
              <Label className="text-xs text-gray-500">Available time *</Label>
              {requiredSlots > 1 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Select the first slot — {requiredSlots} consecutive slots will be reserved.
                </p>
              )}
              {loadingSlots ? (
                <p className="text-sm text-gray-500 mt-1">Loading slots...</p>
              ) : compatibleSlots.length === 0 ? (
                <p className="text-sm text-amber-600 mt-1">
                  {requiredSlots > 1
                    ? `No ${requiredSlots} consecutive available slots for this date`
                    : 'No available slots for this date'}
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
                  {requiredSlots > 1 &&
                    selectedSlotIds.length > 0 &&
                    selectedSlotIds.length < requiredSlots && (
                      <p className="text-xs text-amber-600 mt-1">
                        Need {requiredSlots - selectedSlotIds.length} more consecutive slot(s). Choose a different time.
                      </p>
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
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            loading={isLoading}
          >
            {isSimultaneous
              ? selectedTime
                ? 'Reschedule'
                : 'Select a time'
              : selectedSlotIds.length > 0 && selectedSlotIds.length < requiredSlots
              ? `Select ${requiredSlots - selectedSlotIds.length} more slot(s)`
              : 'Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
