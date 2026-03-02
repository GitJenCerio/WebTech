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
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Calendar } from '@/components/ui/Calendar';
import { cn } from '@/components/ui/Utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useNailTechs } from '@/lib/hooks/useNailTechs';
import { formatTime12Hour } from '@/lib/utils';
import { normalizeSlotTime } from '@/lib/constants/slots';
import { getRequiredSlotCountForService } from '@/lib/serviceSlotCount';
import type { ServiceType } from '@/lib/types';

const BOOKED_STATUSES = ['pending', 'confirmed'] as const;

const SERVICE_TYPES: ServiceType[] = [
  'Manicure',
  'Pedicure',
  'Manicure + Pedicure',
  'Manicure for 2',
  'Pedicure for 2',
  'Manicure + Pedicure for 1',
  'Manicure + Pedicure for 2',
];

interface Slot {
  _id: string;
  date: string;
  time: string;
  status: string;
  nailTechId: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface AddBookingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddBookingModal({
  open,
  onClose,
  onSuccess,
}: AddBookingModalProps) {
  const { nailTechs, loading: nailTechsLoading } = useNailTechs();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [nailTechId, setNailTechId] = useState('');
  const [date, setDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Manicure');
  const [location, setLocation] = useState<'homebased_studio' | 'home_service'>('homebased_studio');
  const [clientNotes, setClientNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    socialMediaName: '',
  });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!nailTechId || !date) {
      setAllSlots([]);
      setAvailableSlots([]);
      setSelectedSlotId('');
      return;
    }
    try {
      setLoadingSlots(true);
      setAllSlots([]);
      setAvailableSlots([]);
      setSelectedSlotId('');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
      setAllSlots([]);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [nailTechId, date]);

  useEffect(() => {
    if (open) {
      fetchCustomers();
      setError(null);
      setCustomerId('');
      setNailTechId('');
      setDate('');
      setSelectedSlotId('');
      setServiceType('Manicure');
      setLocation('homebased_studio');
      setClientNotes('');
      setAdminNotes('');
      setCreateNewCustomer(false);
      setNewCustomer({ name: '', email: '', phone: '', socialMediaName: '' });
    }
  }, [open, fetchCustomers]);

  useEffect(() => {
    if (open && nailTechId && date) {
      fetchSlots();
    } else {
      setAllSlots([]);
      setAvailableSlots([]);
      setSelectedSlotId('');
    }
  }, [open, nailTechId, date, fetchSlots]);

  const requiredSlots = useMemo(
    () => getRequiredSlotCountForService(serviceType, location),
    [serviceType, location]
  );

  const selectedSlotIds = useMemo(() => {
    if (!selectedSlotId || availableSlots.length === 0) return [];
    const first = availableSlots.find((s) => String((s as { _id?: string; id?: string })._id ?? (s as { id?: string }).id) === selectedSlotId);
    if (!first) return [];
    if (requiredSlots === 1) return [String((first as { _id?: string; id?: string })._id ?? (first as { id?: string }).id)];
    const chain = findNextConsecutiveAvailable(allSlots, availableSlots, first, requiredSlots);
    return chain.map((s) => String((s as { _id?: string; id?: string })._id ?? (s as { id?: string }).id));
  }, [selectedSlotId, availableSlots, allSlots, requiredSlots, findNextConsecutiveAvailable]);

  const compatibleSlots = useMemo(() => {
    if (requiredSlots <= 1) return availableSlots;
    return availableSlots.filter((slot) => {
      const chain = findNextConsecutiveAvailable(allSlots, availableSlots, slot, requiredSlots);
      return chain.length >= requiredSlots;
    });
  }, [availableSlots, allSlots, requiredSlots, findNextConsecutiveAvailable]);

  useEffect(() => {
    if (selectedSlotId && selectedSlotIds.length < requiredSlots) {
      setSelectedSlotId('');
    }
  }, [requiredSlots, selectedSlotId, selectedSlotIds.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let resolvedCustomerId = customerId;
    let customerPayload: Record<string, unknown> | undefined;

    if (createNewCustomer) {
      if (!newCustomer.name.trim()) {
        setError('Client name is required');
        return;
      }
      customerPayload = {
        name: newCustomer.name.trim(),
        email: newCustomer.email.trim() || undefined,
        phone: newCustomer.phone.trim() || undefined,
        socialMediaName: newCustomer.socialMediaName.trim() || undefined,
      };
      resolvedCustomerId = '';
    } else if (!customerId) {
      setError('Please select a client');
      return;
    }

    if (!nailTechId) {
      setError('Please select a nail tech');
      return;
    }
    if (selectedSlotIds.length === 0) {
      setError(requiredSlots > 1 ? `Please select a slot with ${requiredSlots} consecutive slots (no slots booked in between)` : 'Please select an available slot');
      return;
    }

    try {
      setSubmitting(true);
      const body: Record<string, unknown> = {
        slotIds: selectedSlotIds,
        nailTechId,
        customerId: resolvedCustomerId || undefined,
        customer: customerPayload,
        service: {
          type: serviceType,
          location,
          clientType: createNewCustomer ? 'new' : 'repeat',
        },
        clientNotes: clientNotes.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    (createNewCustomer ? newCustomer.name.trim() : customerId) &&
    nailTechId &&
    selectedSlotIds.length >= requiredSlots &&
    !submitting;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-[#e5e5e5] bg-[#f7f7f7] px-6 py-4">
          <DialogTitle>Add Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4 min-h-0">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create-new-client"
                checked={createNewCustomer}
                onChange={(e) => {
                  setCreateNewCustomer(e.target.checked);
                  if (e.target.checked) setCustomerId('');
                  else setNewCustomer({ name: '', email: '', phone: '', socialMediaName: '' });
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor="create-new-client" className="text-sm cursor-pointer">
                Create new client
              </Label>
            </div>

            {createNewCustomer ? (
              <div className="space-y-3 p-3 rounded-lg border border-[#e5e5e5] bg-[#f9f9f9]">
                <div>
                  <Label className="text-xs text-gray-500">Name *</Label>
                  <Input
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer((c) => ({ ...c, name: e.target.value }))
                    }
                    className="h-9 mt-1"
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <Input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((c) => ({ ...c, email: e.target.value }))
                    }
                    className="h-9 mt-1"
                    placeholder="Email"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <Input
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer((c) => ({ ...c, phone: e.target.value }))
                    }
                    className="h-9 mt-1"
                    placeholder="Phone"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-xs text-gray-500">Client *</Label>
                <Select
                  value={customerId}
                  onValueChange={setCustomerId}
                  disabled={loadingCustomers}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.phone ? ` (${c.phone})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs text-gray-500">Service Type *</Label>
              <Select
                value={serviceType}
                onValueChange={(v) => {
                  setServiceType(v as ServiceType);
                  setSelectedSlotId('');
                }}
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-500">Location</Label>
              <Select
                value={location}
                onValueChange={(v) => {
                  setLocation(v as 'homebased_studio' | 'home_service');
                  setSelectedSlotId('');
                }}
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homebased_studio">Studio</SelectItem>
                  <SelectItem value="home_service">Home Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-500">Nail Tech *</Label>
              <Select
                value={nailTechId}
                onValueChange={(v) => {
                  setNailTechId(v);
                  setSelectedSlotId('');
                }}
                disabled={nailTechsLoading}
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Select nail tech" />
                </SelectTrigger>
                <SelectContent>
                  {nailTechs.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-500">Date *</Label>
              <Popover>
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
                    selected={date ? new Date(date) : undefined}
                    onSelect={(d) => {
                      if (d) {
                        setDate(format(d, 'yyyy-MM-dd'));
                        setSelectedSlotId('');
                      }
                    }}
                    defaultMonth={date ? new Date(date) : new Date()}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    numberOfMonths={1}
                    navLayout="around"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {date && nailTechId && (
              <div>
                <Label className="text-xs text-gray-500">Available Slot *</Label>
                {requiredSlots > 1 && (
                  <p className="text-xs text-gray-500 mt-0.5">Select the first slot — {requiredSlots} consecutive slots (no slots booked in between) will be reserved.</p>
                )}
                {loadingSlots ? (
                  <p className="text-sm text-gray-500 mt-1">Loading slots...</p>
                ) : compatibleSlots.length === 0 ? (
                  <div className="mt-1 space-y-2">
                    <p className="text-sm text-amber-600">
                      {requiredSlots > 1
                        ? availableSlots.length > 0
                          ? `Need ${requiredSlots} consecutive slots (no slots booked in between). Available slots are not consecutive — try another date.`
                          : `No ${requiredSlots} consecutive slots available for this date`
                        : 'No available slots for this date'}
                    </p>
                    {requiredSlots > 1 && availableSlots.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Available: {[...availableSlots]
                          .sort((a, b) => normalizeSlotTime(a.time).localeCompare(normalizeSlotTime(b.time)))
                          .map((s) => formatTime12Hour(s.time))
                          .join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {compatibleSlots.map((slot) => {
                      const slotId = String((slot as { _id?: string; id?: string })._id ?? (slot as { id?: string }).id ?? '');
                      return (
                      <button
                        key={slotId}
                        type="button"
                        onClick={() =>
                          setSelectedSlotId(
                            selectedSlotId === slotId ? '' : slotId
                          )
                        }
                        className={`h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
                          selectedSlotIds.includes(slotId)
                            ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white'
                            : 'border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a]'
                        }`}
                      >
                        <span className="whitespace-nowrap">{formatTime12Hour(slot.time)}</span>
                      </button>
                    );})}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label className="text-xs text-gray-500">Client Notes</Label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full mt-1 min-h-[60px] px-3 py-2 text-sm rounded-lg border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Admin Notes</Label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full mt-1 min-h-[60px] px-3 py-2 text-sm rounded-lg border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-[#e5e5e5] bg-[#f7f7f7] px-6 py-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit} loading={submitting}>
              Create Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
