'use client';

import { useState, useEffect, useCallback } from 'react';
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
  /** Optional reason for the reschedule (can be collected in-modal or passed in). */
  reason?: string;
  onConfirm: (newSlotIds: string[], reason?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function RescheduleSlotModal({
  open,
  onOpenChange,
  bookingId,
  nailTechId: initialNailTechId,
  reason,
  onConfirm,
  isLoading = false,
}: RescheduleSlotModalProps) {
  const { nailTechs, loading: nailTechsLoading } = useNailTechs();
  const [date, setDate] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [nailTechId, setNailTechId] = useState(initialNailTechId);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    if (!nailTechId || !date) {
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
      const slots = (data.slots ?? []).filter((s: Slot) => s.status === 'available');
      setAvailableSlots(slots);
      setSelectedSlotId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
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
      setAvailableSlots([]);
      setSelectedSlotId('');
      setReasonText('');
      setError(null);
    }
  }, [open, initialNailTechId]);

  useEffect(() => {
    if (open && nailTechId && date) {
      fetchSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlotId('');
    }
  }, [open, nailTechId, date, fetchSlots]);

  const handleConfirm = async () => {
    if (!selectedSlotId) return;
    setError(null);
    try {
      await onConfirm([selectedSlotId], reasonText.trim() || undefined);
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose new slot</DialogTitle>
          <DialogDescription>
            Select a new date and time for this booking. The current slots will be released.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
                  showOutsideDays={false}
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
              {loadingSlots ? (
                <p className="text-sm text-gray-500 mt-1">Loading slots...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-amber-600 mt-1">No available slots for this date</p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableSlots.map((slot) => {
                    const slotId = String(slot._id ?? (slot as { id?: string }).id ?? '');
                    return (
                      <button
                        key={slotId}
                        type="button"
                        onClick={() => setSelectedSlotId(selectedSlotId === slotId ? '' : slotId)}
                        className={`h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
                          selectedSlotId === slotId
                            ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white'
                            : 'border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a]'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedSlotId || isLoading}
            loading={isLoading}
          >
            Reschedule to selected slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
