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
import type { ServiceType } from '@/lib/types';

const SERVICE_TYPES: ServiceType[] = [
  'Russian Manicure',
  'Russian Pedicure',
  'Russian Mani + Pedi',
  'Russian Manicure for 2',
  'Russian Pedicure for 2',
  'Russian Mani + Pedi for 1',
  'Russian Mani + Pedi for 2',
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
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [nailTechId, setNailTechId] = useState('');
  const [date, setDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Russian Manicure');
  const [location, setLocation] = useState<'homebased_studio' | 'home_service'>('homebased_studio');
  const [clientType, setClientType] = useState<'new' | 'repeat'>('new');
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
      setAvailableSlots([]);
      setSelectedSlotId('');
      return;
    }
    try {
      setLoadingSlots(true);
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
      const slots = (data.slots ?? []).filter(
        (s: Slot) => s.status === 'available'
      );
      setAvailableSlots(slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
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
      setServiceType('Russian Manicure');
      setLocation('homebased_studio');
      setClientType('new');
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
      setAvailableSlots([]);
      setSelectedSlotId('');
    }
  }, [open, nailTechId, date, fetchSlots]);

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
    if (!selectedSlotId) {
      setError('Please select an available slot');
      return;
    }

    try {
      setSubmitting(true);
      const body: Record<string, unknown> = {
        slotIds: [selectedSlotId],
        nailTechId,
        customerId: resolvedCustomerId || undefined,
        customer: customerPayload,
        service: {
          type: serviceType,
          location,
          clientType,
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
    selectedSlotId &&
    !submitting;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-4">
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
                    showOutsideDays={false}
                    navLayout="around"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {date && nailTechId && (
              <div>
                <Label className="text-xs text-gray-500">Available Slot *</Label>
                {loadingSlots ? (
                  <p className="text-sm text-gray-500 mt-1">Loading slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-amber-600 mt-1">
                    No available slots for this date
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableSlots.map((slot) => {
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
                          selectedSlotId === slotId
                            ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white'
                            : 'border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a]'
                        }`}
                      >
                        {formatTime12Hour(slot.time)}
                      </button>
                    );})}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label className="text-xs text-gray-500">Service Type *</Label>
              <Select
                value={serviceType}
                onValueChange={(v) => setServiceType(v as ServiceType)}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Location</Label>
                <Select
                  value={location}
                  onValueChange={(v) =>
                    setLocation(v as 'homebased_studio' | 'home_service')
                  }
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
                <Label className="text-xs text-gray-500">Client Type</Label>
                <Select
                  value={clientType}
                  onValueChange={(v) => setClientType(v as 'new' | 'repeat')}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="repeat">Repeat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
          <DialogFooter>
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
