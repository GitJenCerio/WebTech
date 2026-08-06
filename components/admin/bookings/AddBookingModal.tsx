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
import { findConsecutiveAvailableSlots } from '@/lib/utils/consecutiveSlots';
import { CHOSEN_SERVICE_LABELS } from '@/lib/serviceLabels';
import { getRequiredSlotCountForService } from '@/lib/serviceSlotCount';
import { isExpressManiPediServiceType } from '@/lib/utils/bookingInvoice';
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

  const findNextConsecutiveAvailable = useCallback((slots: Slot[], avail: Slot[], fromSlot: Slot, count: number): Slot[] => {
    return findConsecutiveAvailableSlots(slots, avail, fromSlot, count);
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [nailTechId, setNailTechId] = useState('');
  const [manicureTechId, setManicureTechId] = useState('');
  const [pedicureTechId, setPedicureTechId] = useState('');
  const [maniSlots, setManiSlots] = useState<Slot[]>([]);
  const [pediSlots, setPediSlots] = useState<Slot[]>([]);
  const [loadingDualSlots, setLoadingDualSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [date, setDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Manicure');
  const [location, setLocation] = useState<'homebased_studio' | 'home_service'>('homebased_studio');
  const [chosenServices, setChosenServices] = useState<string[]>([]);
  const [clientNotes, setClientNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
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
      setManicureTechId('');
      setPedicureTechId('');
      setManiSlots([]);
      setPediSlots([]);
      setSelectedTime('');
      setDate('');
      setSelectedSlotId('');
      setServiceType('Manicure');
      setLocation('homebased_studio');
      setChosenServices([]);
      setClientNotes('');
      setAdminNotes('');
      setCreateNewCustomer(false);
      setNewCustomer({ name: '', email: '', phone: '', socialMediaName: '' });
      setClientSearch('');
      setClientDropdownOpen(false);
    }
  }, [open, fetchCustomers]);

  const isExpress = useMemo(() => isExpressManiPediServiceType(serviceType), [serviceType]);

  useEffect(() => {
    if (open && !isExpress && nailTechId && date) {
      fetchSlots();
    } else if (!isExpress) {
      setAllSlots([]);
      setAvailableSlots([]);
      setSelectedSlotId('');
    }
  }, [open, isExpress, nailTechId, date, fetchSlots]);

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

  useEffect(() => {
    if (open && isExpress && manicureTechId && pedicureTechId && date) {
      fetchDualSlots();
    } else if (isExpress) {
      setManiSlots([]);
      setPediSlots([]);
      setSelectedTime('');
    }
  }, [open, isExpress, manicureTechId, pedicureTechId, date, fetchDualSlots]);

  const commonTimes = useMemo(() => {
    if (!isExpress || maniSlots.length === 0 || pediSlots.length === 0) return [];
    const maniTimes = new Set(maniSlots.filter((s) => s.status === 'available').map((s) => s.time));
    return pediSlots
      .filter((s) => s.status === 'available' && maniTimes.has(s.time))
      .map((s) => s.time)
      .sort((a, b) => normalizeSlotTime(a).localeCompare(normalizeSlotTime(b)));
  }, [isExpress, maniSlots, pediSlots]);

  const dualSlotIds = useMemo(() => {
    if (!isExpress || !selectedTime) return [];
    const maniSlot = maniSlots.find((s) => s.time === selectedTime && s.status === 'available');
    const pediSlot = pediSlots.find((s) => s.time === selectedTime && s.status === 'available');
    if (!maniSlot || !pediSlot) return [];
    return [String(maniSlot._id), String(pediSlot._id)];
  }, [isExpress, selectedTime, maniSlots, pediSlots]);

  const requiredSlots = useMemo(
    () => (isExpress ? 2 : getRequiredSlotCountForService(serviceType, location)),
    [isExpress, serviceType, location]
  );

  const selectedSlotIds = useMemo(() => {
    if (isExpress) return dualSlotIds;
    if (!selectedSlotId || availableSlots.length === 0) return [];
    const first = availableSlots.find((s) => String((s as { _id?: string; id?: string })._id ?? (s as { id?: string }).id) === selectedSlotId);
    if (!first) return [];
    if (requiredSlots === 1) return [String((first as { _id?: string; id?: string })._id ?? (first as { id?: string }).id)];
    const chain = findNextConsecutiveAvailable(allSlots, availableSlots, first, requiredSlots);
    return chain.map((s) => String((s as { _id?: string; id?: string })._id ?? (s as { id?: string }).id));
  }, [isExpress, dualSlotIds, selectedSlotId, availableSlots, allSlots, requiredSlots, findNextConsecutiveAvailable]);

  const compatibleSlots = useMemo(() => {
    if (isExpress) return [];
    if (requiredSlots <= 1) return availableSlots;
    return availableSlots.filter((slot) => {
      const chain = findNextConsecutiveAvailable(allSlots, availableSlots, slot, requiredSlots);
      return chain.length >= requiredSlots;
    });
  }, [isExpress, availableSlots, allSlots, requiredSlots, findNextConsecutiveAvailable]);

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

    if (isExpress) {
      if (!manicureTechId || !pedicureTechId) {
        setError('Please select both manicure and pedicure nail techs');
        return;
      }
      if (manicureTechId === pedicureTechId) {
        setError('Please select two different nail techs for Mani + Pedi Express');
        return;
      }
    } else if (!nailTechId) {
      setError('Please select a nail tech');
      return;
    }
    if (selectedSlotIds.length === 0) {
      setError(
        isExpress
          ? 'Please select a time where both nail techs are available'
          : requiredSlots > 1
            ? `Please select a slot with ${requiredSlots} consecutive slots (no slots booked in between)`
            : 'Please select an available slot'
      );
      return;
    }

    try {
      setSubmitting(true);
      const body: Record<string, unknown> = {
        slotIds: selectedSlotIds,
        nailTechId: isExpress ? manicureTechId : nailTechId,
        customerId: resolvedCustomerId || undefined,
        customer: customerPayload,
        service: {
          type: serviceType,
          location,
          clientType: createNewCustomer ? 'new' : 'repeat',
          chosenServices: chosenServices.length > 0 ? chosenServices : undefined,
          ...(isExpress
            ? {
                mode: 'simultaneous_two_techs',
                secondaryNailTechId: pedicureTechId,
              }
            : {}),
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
    (isExpress ? manicureTechId && pedicureTechId && manicureTechId !== pedicureTechId : nailTechId) &&
    selectedSlotIds.length >= requiredSlots &&
    !submitting;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[min(100%,40rem)] sm:max-w-2xl max-h-[94vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-[#e7e2db] bg-[#f7f6f4] px-3 sm:px-4 py-2.5 pr-10">
          <DialogTitle>Add Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto py-3 px-3 sm:px-4 space-y-3 min-h-0">
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
                className="rounded border-border"
              />
              <Label htmlFor="create-new-client" className="label-inline">
                Create new client
              </Label>
            </div>

            {createNewCustomer ? (
              <div className="space-y-3 p-3 rounded-lg border border-[#e7e2db] bg-[#f7f6f4]">
                <div>
                  <Label>Name *</Label>
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
                  <Label>Email</Label>
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
                  <Label>Phone</Label>
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
              <div className="relative">
                <Label>Client *</Label>
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setCustomerId('');
                    setClientDropdownOpen(true);
                  }}
                  onFocus={() => setClientDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setClientDropdownOpen(false), 150)}
                  placeholder={loadingCustomers ? 'Loading...' : 'Search client...'}
                  disabled={loadingCustomers}
                  className="w-full mt-1 h-9 px-3 text-base rounded-xl border border-[#e7e2db] bg-[#f7f6f4] text-[#1c1917] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10 focus:border-[#1c1917] focus:bg-pearl transition-all disabled:opacity-50"
                />
                {clientDropdownOpen && clientSearch.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#e7e2db] bg-pearl shadow-lg">
                    {customers
                      .filter((c) =>
                        `${c.name} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(clientSearch.toLowerCase())
                      )
                      .slice(0, 20)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setCustomerId(c.id);
                            setClientSearch(`${c.name}${c.phone ? ` (${c.phone})` : ''}`);
                            setClientDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-[#1c1917] hover:bg-[#f7f6f4] transition-colors"
                        >
                          {c.name}
                          {c.phone && <span className="text-muted-foreground ml-1">{c.phone}</span>}
                        </button>
                      ))}
                    {customers.filter((c) =>
                      `${c.name} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(clientSearch.toLowerCase())
                    ).length === 0 && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No clients found</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Service Type *</Label>
              <Select
                value={serviceType}
                onValueChange={(v) => {
                  setServiceType(v as ServiceType);
                  setSelectedSlotId('');
                  setManicureTechId('');
                  setPedicureTechId('');
                  setSelectedTime('');
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
              <Label>Specific / Add-ons</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CHOSEN_SERVICE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setChosenServices((prev) =>
                        prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
                      )
                    }
                    className={`h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
                      chosenServices.includes(value)
                        ? 'bg-[#1c1917] border-[#1c1917] text-white'
                        : 'border-[#e7e2db] bg-pearl text-[#1c1917] hover:border-[#1c1917]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {([['homebased_studio', 'Studio'], ['home_service', 'Home Service']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setLocation(val);
                      setSelectedSlotId('');
                    }}
                    className={`h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
                      location === val
                        ? 'bg-[#1c1917] border-[#1c1917] text-white'
                        : 'border-[#e7e2db] bg-pearl text-[#1c1917] hover:border-[#1c1917]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {isExpress ? (
                <>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 mb-3">
                    Select one nail tech for <strong>Manicure</strong> and a different one for <strong>Pedicure</strong>. Two slots at the same time will be reserved.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Manicure tech *</Label>
                      <Select
                        value={manicureTechId}
                        onValueChange={(v) => {
                          setManicureTechId(v);
                          if (v === pedicureTechId) setPedicureTechId('');
                          setSelectedTime('');
                        }}
                        disabled={nailTechsLoading}
                      >
                        <SelectTrigger className="h-9 mt-1">
                          <SelectValue placeholder="Select tech" />
                        </SelectTrigger>
                        <SelectContent>
                          {nailTechs.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id} disabled={tech.id === pedicureTechId}>
                              Ms. {tech.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Pedicure tech *</Label>
                      <Select
                        value={pedicureTechId}
                        onValueChange={(v) => {
                          setPedicureTechId(v);
                          if (v === manicureTechId) setManicureTechId('');
                          setSelectedTime('');
                        }}
                        disabled={nailTechsLoading}
                      >
                        <SelectTrigger className="h-9 mt-1">
                          <SelectValue placeholder="Select tech" />
                        </SelectTrigger>
                        <SelectContent>
                          {nailTechs.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id} disabled={tech.id === manicureTechId}>
                              Ms. {tech.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Label>Nail Tech *</Label>
                  {nailTechsLoading ? (
                    <p className="text-sm text-muted-foreground mt-1">Loading...</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {nailTechs.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setNailTechId(t.id);
                            setSelectedSlotId('');
                          }}
                          className={`h-9 px-3 rounded-lg border text-sm font-medium transition-all truncate ${
                            nailTechId === t.id
                              ? 'bg-[#1c1917] border-[#1c1917] text-white'
                              : 'border-[#e7e2db] bg-pearl text-[#1c1917] hover:border-[#1c1917]'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <Label>Date *</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-2 w-full mt-1 min-w-[120px] rounded-xl border border-[#e7e2db] bg-[#f7f6f4] text-[#1c1917] transition-all h-9 px-3 text-sm',
                      'hover:border-[#1c1917]/30 focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10 focus:border-[#1c1917]'
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{date ? format(new Date(date), 'MMM d, yyyy') : 'Pick date'}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="admin-date-picker-popover w-auto p-0 rounded-none border-[#e7e2db] shadow-lg bg-pearl"
                >
                  <Calendar
                    mode="single"
                    selected={date ? new Date(date) : undefined}
                    onSelect={(d) => {
                      if (d) {
                        setDate(format(d, 'yyyy-MM-dd'));
                        setSelectedSlotId('');
                        setCalendarOpen(false);
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

            {date && (isExpress ? manicureTechId && pedicureTechId : nailTechId) && (
              <div>
                <Label>{isExpress ? 'Available time *' : 'Available Slot *'}</Label>
                {!isExpress && requiredSlots > 1 && (
                  <p className="text-xs text-muted-foreground mt-0.5">Select the first slot — {requiredSlots} consecutive slots (no slots booked in between) will be reserved.</p>
                )}
                {isExpress ? (
                  loadingDualSlots ? (
                    <p className="text-sm text-muted-foreground mt-1">Loading slots...</p>
                  ) : commonTimes.length === 0 ? (
                    <p className="text-sm text-amber-600 mt-1">No common available time slots for both techs on this date.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {commonTimes.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(selectedTime === time ? '' : time)}
                          className={`h-9 px-3 rounded-lg border text-sm font-medium transition-all ${
                            selectedTime === time
                              ? 'bg-[#1c1917] border-[#1c1917] text-white'
                              : 'border-[#e7e2db] bg-pearl text-[#1c1917] hover:border-[#1c1917]'
                          }`}
                        >
                          <span className="whitespace-nowrap">{formatTime12Hour(time)}</span>
                        </button>
                      ))}
                    </div>
                  )
                ) : loadingSlots ? (
                  <p className="text-sm text-muted-foreground mt-1">Loading slots...</p>
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
                      <p className="text-xs text-muted-foreground">
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
                            ? 'bg-[#1c1917] border-[#1c1917] text-white'
                            : 'border-[#e7e2db] bg-pearl text-[#1c1917] hover:border-[#1c1917]'
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
              <Label>Client Notes</Label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full mt-1 min-h-[60px] px-3 py-2 text-sm rounded-lg border border-[#e7e2db] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10"
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Admin Notes</Label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full mt-1 min-h-[60px] px-3 py-2 text-sm rounded-lg border border-[#e7e2db] focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10"
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-[#e7e2db] bg-[#f7f6f4] px-3 sm:px-4 py-2.5">
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
