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
import { getRequiredSlotCountForService } from '@/lib/serviceSlotCount';
import { mapServiceToStandardDisplay, CHOSEN_SERVICE_LABELS } from '@/lib/serviceLabels';
import { useNailTechs } from '@/lib/hooks/useNailTechs';
import { formatTime12Hour } from '@/lib/utils';
import { normalizeSlotTime } from '@/lib/constants/slots';
import type { ServiceType } from '@/lib/types';

const CHOSEN_SERVICE_OPTIONS = Object.entries(CHOSEN_SERVICE_LABELS).map(([value, label]) => ({ value, label }));

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

interface ChangeServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentService?: string;
  currentServiceLocation?: 'homebased_studio' | 'home_service';
  currentChosenServices?: string[];
  currentSlotCount?: number;
  onConfirm: (service: {
    type: string;
    location?: string;
    chosenServices?: string[];
    secondaryNailTechId?: string;
    newSlotIds?: string[];
  }) => Promise<void>;
  isLoading?: boolean;
}

function isSimultaneous(serviceType: string) {
  const k = serviceType.toLowerCase().trim();
  return k.includes('express') || k.includes('simultaneous');
}

export default function ChangeServiceModal({
  open,
  onOpenChange,
  currentService,
  currentServiceLocation = 'homebased_studio',
  currentChosenServices = [],
  currentSlotCount = 1,
  onConfirm,
  isLoading = false,
}: ChangeServiceModalProps) {
  const { nailTechs, loading: nailTechsLoading } = useNailTechs();

  const [selectedServiceType, setSelectedServiceType] = useState<string>(
    mapServiceToStandardDisplay(currentService)
  );
  const [chosenServices, setChosenServices] = useState<string[]>(currentChosenServices);
  const [error, setError] = useState<string | null>(null);

  // ── Dual-tech state (Mani + Pedi Express) ─────────────────────
  const [manicureTechId, setManicureTechId] = useState('');
  const [pedicureTechId, setPedicureTechId] = useState('');
  const [date, setDate] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [maniSlots, setManiSlots] = useState<Slot[]>([]);
  const [pediSlots, setPediSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');

  const simultaneous = isSimultaneous(selectedServiceType);
  const requiredSlots = getRequiredSlotCountForService(selectedServiceType, currentServiceLocation);

  // For non-simultaneous services, check if current slots are enough
  const canChangeWithoutReschedule = !simultaneous && requiredSlots <= currentSlotCount;

  // Common times where both techs have an available slot
  const commonTimes = useMemo(() => {
    if (!simultaneous || maniSlots.length === 0 || pediSlots.length === 0) return [];
    const maniAvail = new Set(
      maniSlots.filter((s) => s.status === 'available').map((s) => s.time)
    );
    return pediSlots
      .filter((s) => s.status === 'available' && maniAvail.has(s.time))
      .map((s) => s.time)
      .sort((a, b) => normalizeSlotTime(a).localeCompare(normalizeSlotTime(b)));
  }, [simultaneous, maniSlots, pediSlots]);

  // The two slot IDs for selected common time
  const dualSlotIds = useMemo(() => {
    if (!simultaneous || !selectedTime) return [];
    const maniSlot = maniSlots.find((s) => s.time === selectedTime && s.status === 'available');
    const pediSlot = pediSlots.find((s) => s.time === selectedTime && s.status === 'available');
    if (!maniSlot || !pediSlot) return [];
    return [String(maniSlot._id), String(pediSlot._id)];
  }, [simultaneous, selectedTime, maniSlots, pediSlots]);

  // Fetch slots for both techs
  const fetchDualSlots = useCallback(async () => {
    if (!manicureTechId || !pedicureTechId || !date) {
      setManiSlots([]);
      setPediSlots([]);
      setSelectedTime('');
      return;
    }
    try {
      setLoadingSlots(true);
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
      setLoadingSlots(false);
    }
  }, [manicureTechId, pedicureTechId, date]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedServiceType(mapServiceToStandardDisplay(currentService));
      setChosenServices(Array.isArray(currentChosenServices) ? currentChosenServices : []);
      setError(null);
      setManicureTechId('');
      setPedicureTechId('');
      setDate('');
      setManiSlots([]);
      setPediSlots([]);
      setSelectedTime('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentService]);

  // Reset dual state when service type changes
  useEffect(() => {
    setManicureTechId('');
    setPedicureTechId('');
    setDate('');
    setManiSlots([]);
    setPediSlots([]);
    setSelectedTime('');
  }, [selectedServiceType]);

  // Fetch slots when both techs + date are selected
  useEffect(() => {
    if (simultaneous && manicureTechId && pedicureTechId && date) {
      fetchDualSlots();
    }
  }, [simultaneous, manicureTechId, pedicureTechId, date, fetchDualSlots]);

  const handleConfirm = async () => {
    setError(null);
    try {
      if (simultaneous) {
        if (dualSlotIds.length < 2) return;
        await onConfirm({
          type: selectedServiceType,
          location: currentServiceLocation,
          chosenServices: chosenServices.length > 0 ? chosenServices : undefined,
          secondaryNailTechId: pedicureTechId,
          newSlotIds: dualSlotIds,
        });
      } else {
        if (!canChangeWithoutReschedule) return;
        await onConfirm({
          type: selectedServiceType,
          location: currentServiceLocation,
          chosenServices: chosenServices.length > 0 ? chosenServices : undefined,
        });
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = date ? new Date(date) : undefined;

  const canConfirm = simultaneous
    ? dualSlotIds.length === 2
    : canChangeWithoutReschedule;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Change service</DialogTitle>
          <DialogDescription>
            {simultaneous
              ? 'Select 2 nail techs (one for Mani, one for Pedi) and pick a time where both are available.'
              : `Change the service type for this booking. Current booking has ${currentSlotCount} slot(s).`}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4 py-4 pr-1">
          {/* Service type */}
          <div>
            <Label className="text-xs text-gray-500">Service type *</Label>
            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
              <SelectTrigger className="h-9 mt-1">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                    {!isSimultaneous(s) && getRequiredSlotCountForService(s, currentServiceLocation) > 1
                      ? ` (${getRequiredSlotCountForService(s, currentServiceLocation)} slots)`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!simultaneous && !canChangeWithoutReschedule && (
              <p className="text-xs text-amber-600 mt-1">
                This service requires {requiredSlots} slot(s) but booking has {currentSlotCount}. Use <strong>Reschedule</strong> to select more slots.
              </p>
            )}
          </div>

          {/* ── SIMULTANEOUS: dual tech selectors ── */}
          {simultaneous && (
            <>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                Pick one nail tech for <strong>Manicure</strong> and a different one for <strong>Pedicure</strong>. Only times where both are free will appear.
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

              {/* Date picker */}
              <div>
                <Label className="text-xs text-gray-500">Date *</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'flex items-center gap-2 w-full mt-1 rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] transition-all h-9 px-3 text-sm',
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

              {/* Common time slots */}
              {manicureTechId && pedicureTechId && date && (
                <div>
                  <Label className="text-xs text-gray-500">Available time *</Label>
                  {loadingSlots ? (
                    <p className="text-sm text-gray-500 mt-1">Loading slots...</p>
                  ) : commonTimes.length === 0 ? (
                    <p className="text-sm text-amber-600 mt-1">
                      No common available times for both techs on this date.
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
                  {selectedTime && dualSlotIds.length === 2 && (
                    <div className="mt-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 space-y-1">
                      <p><strong>Manicure:</strong> Ms. {nailTechs.find((t) => t.id === manicureTechId)?.name} — {formatTime12Hour(selectedTime)}</p>
                      <p><strong>Pedicure:</strong> Ms. {nailTechs.find((t) => t.id === pedicureTechId)?.name} — {formatTime12Hour(selectedTime)}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Specific / Add-ons (for non-simultaneous) */}
          {!simultaneous && (
            <div>
              <Label className="text-xs text-gray-500">Specific / Add-ons</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CHOSEN_SERVICE_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e5e5e5] bg-white cursor-pointer hover:border-[#1a1a1a]/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={chosenServices.includes(value)}
                      onChange={() =>
                        setChosenServices((prev) =>
                          prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
                        )
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-[#1a1a1a]">{label}</span>
                  </label>
                ))}
              </div>
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
            Update service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
