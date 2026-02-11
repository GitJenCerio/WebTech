'use client';

import { useState, useEffect, useCallback } from 'react';
import CalendarPanel from '@/components/admin/bookings/CalendarPanel';
import SlotList from '@/components/admin/bookings/SlotList';
import BookingDetailsModal from '@/components/admin/bookings/BookingDetailsModal';
import InvoiceModal from '@/components/admin/bookings/InvoiceModal';
import AddSlotModal from '@/components/admin/bookings/AddSlotModal';
import EditSlotModal from '@/components/admin/bookings/EditSlotModal';
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal';
import NailTechFilter from '@/components/admin/bookings/NailTechFilter';
import NailTechBadge from '@/components/admin/NailTechBadge';
import DataTable from '@/components/admin/DataTable';
import FilterBar from '@/components/admin/FilterBar';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import ActionDropdown from '@/components/admin/ActionDropdown';
import { BookingStatus } from '@/components/admin/StatusBadge';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { format } from 'date-fns';

function getTechIdFromQuery(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('techId');
}
function cleanCurrencyValue(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.\\-]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

interface Slot {
  id: string;
  date?: string;
  time: string;
  status: BookingStatus;
  type?: 'regular' | 'with_squeeze_fee';
  nailTechId?: string;
  nailTechName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientSocialMediaName?: string;
  service?: string;
  isHidden?: boolean;
  booking?: {
    id: string;
    bookingCode: string;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerSocialMediaName?: string;
    slotIds?: string[];
    service?: { type?: string };
    status: string;
    paymentStatus?: string;
    pricing?: { total?: number; depositRequired?: number };
    payment?: { paymentProofUrl?: string };
  } | null;
}

interface Booking {
  id: string;
  bookingCode?: string;
  customerId?: string;
  nailTechId?: string;
  date: string;
  time: string;
  clientName: string;
  service: string;
  status: BookingStatus;
  amount?: number;
  clientNotes?: string;
  adminNotes?: string;
  socialName?: string;
  amountPaid?: number;
}

export default function BookingsPage() {
  const userRole = useUserRole();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedNailTechId, setSelectedNailTechId] = useState<string>(
    userRole.assignedNailTechId || 'all'
  );
  const [selectedBooking, setSelectedBooking] = useState<{
    id?: string;
    bookingCode?: string;
    customerId?: string;
    nailTechId?: string;
    slotType?: 'regular' | 'with_squeeze_fee' | null;
    date: string;
    time: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    clientSocialMediaName?: string;
    service: string;
    status: BookingStatus;
    notes?: string;
    adminNotes?: string;
    paymentStatus?: string;
    slotCount?: number;
    reservationAmount?: number;
    paidAmount?: number;
    depositRequired?: number;
    paymentProofUrl?: string;
  } | null>(null);
  const [isVerifyingPaymentProof, setIsVerifyingPaymentProof] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<Array<{ description: string; quantity: number; unitPrice: number; total: number }>>([]);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceDiscountAmount, setInvoiceDiscountAmount] = useState<number>(0);
  const [adminNotesDraft, setAdminNotesDraft] = useState('');
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [pricingHeaders, setPricingHeaders] = useState<string[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [selectedPricingService, setSelectedPricingService] = useState('');
  const [currentQuotationId, setCurrentQuotationId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const normalizeServiceName = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '');
  }, []);

  const findPricingRow = useCallback((serviceName: string) => {
    if (!serviceName || pricingData.length === 0) return null;
    const normalized = normalizeServiceName(serviceName.trim());
    if (!normalized) return null;

    return (
      pricingData.find((item) => {
        const firstKey = Object.keys(item)[0];
        const name = String(item[firstKey] || '').trim();
        const rowNorm = normalizeServiceName(name);
        return rowNorm === normalized;
      }) ||
      pricingData.find((item) => {
        const firstKey = Object.keys(item)[0];
        const name = String(item[firstKey] || '').trim();
        const rowNorm = normalizeServiceName(name);
        return rowNorm.includes(normalized) || normalized.includes(rowNorm);
      }) ||
      null
    );
  }, [pricingData, normalizeServiceName]);

  const getUnitPriceForService = useCallback((serviceName: string): number | null => {
    const found = findPricingRow(serviceName);
    if (!found) return null;

    const priceKey =
      pricingHeaders.find((h) => {
        const key = h.toLowerCase();
        return key.includes('price') || key.includes('amount') || key.includes('cost') || key.includes('rate');
      }) || pricingHeaders[1];

    if (priceKey && Object.prototype.hasOwnProperty.call(found, priceKey)) {
      const value = cleanCurrencyValue(found[priceKey] || 0);
      if (value > 0) return value;
    }

    // Fallback: first numeric-looking value in row
    for (const key of Object.keys(found)) {
      const val = cleanCurrencyValue(found[key]);
      if (val > 0) return val;
    }

    return null;
  }, [findPricingRow, pricingHeaders]);

  // State for nail techs
  const [nailTechs, setNailTechs] = useState<Array<{ id: string; name: string; role?: string; discount?: number }>>([]);
  const [nailTechsLoading, setNailTechsLoading] = useState(true);

  useEffect(() => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const rate = typeof selectedBooking?.nailTechId === 'string'
      ? (nailTechs.find((t) => t.id === selectedBooking.nailTechId)?.discount || 0)
      : 0;
    const discountAmount = Math.round(subtotal * (rate / 100));
    if (invoiceDiscountAmount !== discountAmount) {
      setInvoiceDiscountAmount(discountAmount);
    }
  }, [invoiceItems, invoiceDiscountAmount, nailTechs, selectedBooking?.nailTechId]);

  useEffect(() => {
    if (!showInvoiceModal) return;
    if (!selectedBooking?.service) return;
    if (invoiceItems.length !== 1) return;
    if (invoiceItems[0].unitPrice > 0) return;
    const unitPrice = getUnitPriceForService(selectedBooking.service);
    if (unitPrice === null) return;
    setInvoiceItems([{
      ...invoiceItems[0],
      unitPrice,
      total: unitPrice * (invoiceItems[0].quantity || 1),
    }]);
  }, [showInvoiceModal, selectedBooking?.service, invoiceItems, getUnitPriceForService]);

  // State for slots
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // State for monthly slots (for calendar display)
  const [monthlySlots, setMonthlySlots] = useState<Slot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State for add slot operation
  const [addingSlots, setAddingSlots] = useState(false);
  const [addSlotsError, setAddSlotsError] = useState<string | null>(null);

  // State for editing slots
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [editingSlot, setEditingSlot] = useState(false);
  const [editSlotError, setEditSlotError] = useState<string | null>(null);

  // State for delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);
  const [isDeletingSlot, setIsDeletingSlot] = useState(false);

  const mapSlotStatus = useCallback((slot: any): BookingStatus => {
    if (slot.booking?.status === 'pending') return 'PENDING_PAYMENT';
    if (slot.booking?.status === 'confirmed') return 'CONFIRMED';
    if (slot.booking?.status === 'cancelled') return 'CANCELLED';
    if (slot.booking?.status === 'no_show') return 'NO_SHOW';
    if (slot.status === 'blocked') return 'blocked';
    if (slot.status === 'available') return 'available';
    if (slot.status === 'confirmed') return 'CONFIRMED';
    if (slot.status === 'pending') return 'pending';
    return 'booked';
  }, []);

  const mapApiSlotToViewSlot = useCallback((slot: any): Slot => ({
    id: slot.id || slot._id,
    date: slot.date,
    time: slot.time,
    status: mapSlotStatus(slot),
    type: slot.slotType,
    nailTechId: slot.nailTechId,
    nailTechName: nailTechs.find(t => t.id === slot.nailTechId)?.name,
    clientName: slot.booking?.customerName,
    clientEmail: slot.booking?.customerEmail,
    clientPhone: slot.booking?.customerPhone,
    clientSocialMediaName: slot.booking?.customerSocialMediaName,
    service: slot.booking?.service?.type,
    isHidden: slot.isHidden || false,
    booking: slot.booking
      ? {
          id: slot.booking.id,
          bookingCode: slot.booking.bookingCode,
          customerId: slot.booking.customerId,
          customerName: slot.booking.customerName,
          customerEmail: slot.booking.customerEmail,
          customerPhone: slot.booking.customerPhone,
          customerSocialMediaName: slot.booking.customerSocialMediaName,
          slotIds: slot.booking.slotIds,
          service: slot.booking.service,
          status: slot.booking.status,
          paymentStatus: slot.booking.paymentStatus,
          pricing: slot.booking.pricing,
          payment: slot.booking.payment,
        }
      : null,
  }), [mapSlotStatus, nailTechs]);

  // Fetch nail techs on mount
  useEffect(() => {
    async function fetchNailTechs() {
      try {
        setNailTechsLoading(true);
        const response = await fetch('/api/nail-techs');
        if (!response.ok) throw new Error('Failed to fetch nail techs');
        const data = await response.json();
        setNailTechs(data.nailTechs.map((tech: any) => ({
          id: tech.id || tech._id,
          name: tech.name,
          role: tech.specialties?.[0] || 'Nail Tech',
          discount: typeof tech.discount === 'number' ? tech.discount : undefined,
        })));
      } catch (error: any) {
        console.error('Error fetching nail techs:', error);
      } finally {
        setNailTechsLoading(false);
      }
    }
    fetchNailTechs();
  }, []);

  useEffect(() => {
    const techId = getTechIdFromQuery();
    if (techId && techId !== selectedNailTechId) {
      setSelectedNailTechId(techId);
    }
  }, [selectedNailTechId]);

  // Fetch slots when date or nail tech changes
  useEffect(() => {
    async function fetchSlots() {
      try {
        setSlotsLoading(true);
        setSlotsError(null);
        
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const params = new URLSearchParams({ date: dateStr });
        
        if (selectedNailTechId && selectedNailTechId !== 'all') {
          params.append('nailTechId', selectedNailTechId);
        }
        
        const response = await fetch(`/api/slots?${params}`);
        if (!response.ok) throw new Error('Failed to fetch slots');
        
        const data = await response.json();
        setSlots(data.slots.map(mapApiSlotToViewSlot));
      } catch (error: any) {
        console.error('Error fetching slots:', error);
        setSlotsError(error.message);
      } finally {
        setSlotsLoading(false);
      }
    }

    if (!nailTechsLoading) {
      fetchSlots();
    }
  }, [selectedDate, selectedNailTechId, nailTechsLoading, nailTechs, mapApiSlotToViewSlot]);

  // Fetch monthly slots for calendar display
  useEffect(() => {
    async function fetchMonthlySlots() {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
        const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
        
        const params = new URLSearchParams({ startDate, endDate });
        
        if (selectedNailTechId && selectedNailTechId !== 'all') {
          params.append('nailTechId', selectedNailTechId);
        }
        
        const response = await fetch(`/api/slots?${params}`);
        if (!response.ok) throw new Error('Failed to fetch monthly slots');
        
        const data = await response.json();
        setMonthlySlots(data.slots.map((slot: any) => ({
          ...mapApiSlotToViewSlot(slot),
          nailTechName: undefined,
          clientName: undefined,
          service: undefined,
          booking: null,
        })));
      } catch (error: any) {
        console.error('Error fetching monthly slots:', error);
      }
    }

    if (!nailTechsLoading) {
      fetchMonthlySlots();
    }
  }, [currentMonth, selectedNailTechId, nailTechsLoading, mapApiSlotToViewSlot]);

  const handleAddSlot = async (slotsData: Array<{
    date: string;
    time: string;
    status: BookingStatus;
    type: 'regular' | 'with_squeeze_fee';
    nailTechId: string;
    notes?: string;
  }>) => {
    try {
      setAddingSlots(true);
      setAddSlotsError(null);

      // Extract unique dates and times
      const dates = [...new Set(slotsData.map(s => s.date))];
      const times = [...new Set(slotsData.map(s => s.time))];
      const nailTechId = slotsData[0].nailTechId;
      const status = slotsData[0].status;
      const slotType = slotsData[0].type;
      const notes = slotsData[0].notes;

      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates,
          times,
          nailTechId,
          status,
          slotType,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create slots');
      }

      const data = await response.json();
      
      // Refresh slots for the current date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      if (dates.includes(dateStr)) {
        // Re-fetch slots
        const params = new URLSearchParams({ date: dateStr });
        if (selectedNailTechId && selectedNailTechId !== 'all') {
          params.append('nailTechId', selectedNailTechId);
        }
        
        const refreshResponse = await fetch(`/api/slots?${params}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setSlots(refreshData.slots.map(mapApiSlotToViewSlot));
        }
      }

      // Refresh monthly slots for calendar
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
      const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
      
      const monthParams = new URLSearchParams({ startDate, endDate });
      if (selectedNailTechId && selectedNailTechId !== 'all') {
        monthParams.append('nailTechId', selectedNailTechId);
      }
      
      const monthResponse = await fetch(`/api/slots?${monthParams}`);
      if (monthResponse.ok) {
        const monthData = await monthResponse.json();
        setMonthlySlots(monthData.slots.map((slot: any) => ({
          ...mapApiSlotToViewSlot(slot),
          nailTechName: undefined,
          clientName: undefined,
          service: undefined,
          booking: null,
        })));
      }

      setShowAddSlotModal(false);
    } catch (error: any) {
      console.error('Error creating slots:', error);
      setAddSlotsError(error.message);
    } finally {
      setAddingSlots(false);
    }
  };

  const handleEditSlot = async (slotId: string, updates: {
    status?: BookingStatus;
    slotType?: 'regular' | 'with_squeeze_fee';
    notes?: string;
    isHidden?: boolean;
  }) => {
    try {
      setEditingSlot(true);
      setEditSlotError(null);

      const response = await fetch(`/api/slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update slot');
      }

      // Refresh slots for the current date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const params = new URLSearchParams({ date: dateStr });
      if (selectedNailTechId && selectedNailTechId !== 'all') {
        params.append('nailTechId', selectedNailTechId);
      }
      
      const refreshResponse = await fetch(`/api/slots?${params}`);
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setSlots(refreshData.slots.map(mapApiSlotToViewSlot));
      }

      setShowEditSlotModal(false);
      setSelectedSlot(null);
    } catch (error: any) {
      console.error('Error updating slot:', error);
      setEditSlotError(error.message);
    } finally {
      setEditingSlot(false);
    }
  };

  const handleDeleteSlot = (slot: Slot) => {
    setSlotToDelete(slot);
    setShowDeleteConfirmation(true);
    setEditSlotError(null);
  };

  const refreshSelectedDateSlots = useCallback(async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const params = new URLSearchParams({ date: dateStr });
    if (selectedNailTechId && selectedNailTechId !== 'all') {
      params.append('nailTechId', selectedNailTechId);
    }

    const refreshResponse = await fetch(`/api/slots?${params}`);
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      setSlots(refreshData.slots.map(mapApiSlotToViewSlot));
    }
  }, [selectedDate, selectedNailTechId, mapApiSlotToViewSlot]);

  const handleConfirmDelete = async () => {
    if (!slotToDelete) return;

    try {
      setIsDeletingSlot(true);

      const response = await fetch(`/api/slots/${slotToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        let error: any;
        try {
          error = await response.json();
        } catch (e) {
          error = { error: `HTTP ${response.status}` };
        }
        throw new Error(error.error || 'Failed to delete slot');
      }

      await refreshSelectedDateSlots();

      setShowDeleteConfirmation(false);
      setSlotToDelete(null);
      setShowEditSlotModal(false);
      setSelectedSlot(null);
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      setEditSlotError(error.message);
    } finally {
      setIsDeletingSlot(false);
    }
  };

  useEffect(() => {
    async function fetchBookings() {
      try {
        setBookingsLoading(true);
        setBookingsError(null);

        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') {
          params.set('status', statusFilter as any);
        }
        if (dateFrom) params.set('startDate', dateFrom);
        if (dateTo) params.set('endDate', dateTo);

        const response = await fetch(`/api/bookings?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch bookings');

        const data = await response.json();
        const rows: Booking[] = (data.bookings || []).map((booking: any) => {
          const apptDate = booking.appointmentDate || booking.createdAt || '';
          const apptTime = booking.appointmentTime || '';
          return {
            id: booking.id,
            bookingCode: booking.bookingCode,
            customerId: booking.customerId,
            nailTechId: booking.nailTechId,
            date: apptDate,
            time: apptTime,
            clientName: booking.customerName || 'Unknown Client',
            socialName: booking.customerSocialMediaName || '',
            service: booking.service?.type || 'Nail Service',
            status: booking.status || 'booked',
            amount: booking.pricing?.total || 0,
            amountPaid: booking.pricing?.paidAmount || 0,
            clientNotes: booking.clientNotes || '',
            adminNotes: booking.adminNotes || '',
          };
        });

        setBookings(rows);
        setCurrentPage(1);
      } catch (error: any) {
        console.error('Error fetching bookings:', error);
        setBookingsError(error.message || 'Failed to fetch bookings');
      } finally {
        setBookingsLoading(false);
      }
    }

    fetchBookings();
  }, [statusFilter, dateFrom, dateTo]);

  const handleSlotClick = (slot: Slot) => {
    if (slot.booking?.id && slot.clientName) {
      setSelectedBooking({
        id: slot.booking.id,
        bookingCode: slot.booking.bookingCode,
        customerId: slot.booking.customerId,
        date: selectedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: slot.time,
        clientName: slot.clientName,
        clientEmail: slot.booking?.customerEmail,
        clientPhone: slot.booking?.customerPhone,
        clientSocialMediaName: slot.booking?.customerSocialMediaName,
        service: slot.service || 'Nail Service',
        status: slot.status,
        nailTechId: slot.nailTechId,
        slotType: slot.type,
        notes: slot.booking?.clientNotes || undefined,
        paymentStatus: slot.booking.paymentStatus,
        slotCount: (slot.booking.slotIds || []).length || 1,
        reservationAmount: (((slot.booking.slotIds || []).length || 1) * 500),
        paidAmount: slot.booking.pricing?.paidAmount ?? 0,
        depositRequired: slot.booking.pricing?.depositRequired,
        paymentProofUrl: slot.booking.payment?.paymentProofUrl,
        adminNotes: slot.booking?.adminNotes || '',
      });
      setAdminNotesDraft(slot.booking?.adminNotes || '');
      setShowModal(true);
    }
  };

  const handleViewClientProfile = () => {
    if (!selectedBooking?.customerId) return;
    window.location.href = `/admin/clients?customerId=${selectedBooking.customerId}`;
  };

  const handleBookingAction = async (
    action: 'cancel' | 'reschedule' | 'mark_no_show' | 'mark_completed'
  ) => {
    if (!selectedBooking?.id) return;

    try {
      let reason: string | undefined;
      if (action === 'cancel' || action === 'reschedule' || action === 'mark_no_show') {
        const label =
          action === 'cancel'
            ? 'cancel'
            : action === 'reschedule'
              ? 'reschedule'
              : 'mark as no show';
        const input = window.prompt(`Please enter reason to ${label}:`);
        if (input === null) return;
        const trimmed = input.trim();
        if (!trimmed) {
          alert('Reason is required.');
          return;
        }
        reason = trimmed;
      }

      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason,
          adminOverride: action === 'cancel',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update booking status' }));
        throw new Error(errorData.error || 'Failed to update booking status');
      }

      setShowModal(false);
      setSelectedBooking(null);
      await refreshSelectedDateSlots();
    } catch (error: any) {
      console.error(`Error performing booking action (${action}):`, error);
      alert(error.message || 'Failed to update booking');
    }
  };

  const handleVerifyPaymentProof = async () => {
    if (!selectedBooking?.id) return;

    try {
      setIsVerifyingPaymentProof(true);

      // Reservation is fixed at 500 per slot
      const depositAmount = selectedBooking.reservationAmount ?? (((selectedBooking.slotCount || 1) * 500));
      const paymentRes = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_payment',
          paidAmount: depositAmount,
          tipAmount: 0,
        }),
      });

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json().catch(() => ({ error: 'Failed to update payment' }));
        throw new Error(errorData.error || 'Failed to update payment');
      }

      const confirmRes = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });

      if (!confirmRes.ok) {
        const errorData = await confirmRes.json().catch(() => ({ error: 'Failed to confirm booking' }));
        throw new Error(errorData.error || 'Failed to confirm booking');
      }

      setSelectedBooking((prev) =>
        prev
          ? {
              ...prev,
              status: 'CONFIRMED',
              paymentStatus: 'paid',
            }
          : prev
      );

      await refreshSelectedDateSlots();
    } catch (error: any) {
      console.error('Error verifying payment proof:', error);
      alert(error.message || 'Failed to verify payment proof');
    } finally {
      setIsVerifyingPaymentProof(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedBooking?.id) return;
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_notes',
          adminNotes: adminNotesDraft,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save notes' }));
        throw new Error(errorData.error || 'Failed to save notes');
      }
      setSelectedBooking((prev) =>
        prev ? { ...prev, adminNotes: adminNotesDraft } : prev
      );
      await refreshSelectedDateSlots();
    } catch (error: any) {
      console.error('Error saving notes:', error);
      alert(error.message || 'Failed to save notes');
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedBooking?.id) return;
    setInvoiceError(null);
    setInvoiceNotes('');
    setInvoiceDiscountAmount(0);
    const defaultDescription = selectedBooking.service || 'Nail Service';
    setInvoiceItems([
      { description: defaultDescription, quantity: 1, unitPrice: 0, total: 0 },
    ]);
    setCurrentQuotationId(null);
    setSelectedPricingService('');
    setShowInvoiceModal(true);

    try {
      setPricingLoading(true);
      setPricingError(null);
      const pricingRes = await fetch('/api/quotation/pricing');
      const pricingData = await pricingRes.json();
      if (pricingRes.ok && pricingData.available) {
        setPricingData(pricingData.pricing || []);
        setPricingHeaders(pricingData.headers || []);
      } else {
        setPricingError(pricingData.error || 'Pricing data not available');
      }
    } catch (error: any) {
      setPricingError(error.message || 'Failed to load pricing');
    } finally {
      setPricingLoading(false);
    }

    try {
      const bookingRes = await fetch(`/api/bookings/${selectedBooking.id}`);
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json();
        const quotationId = bookingData?.booking?.invoice?.quotationId;
        if (quotationId) {
          const quoteRes = await fetch(`/api/quotations/${quotationId}`);
          if (quoteRes.ok) {
            const quoteData = await quoteRes.json();
            const quotation = quoteData?.quotation;
            if (quotation) {
              setCurrentQuotationId(quotation._id || quotation.id);
              setInvoiceItems(
                (quotation.items || []).map((item: any) => ({
                  description: item.description || '',
                  quantity: item.quantity || 1,
                  unitPrice: item.unitPrice || 0,
                  total: item.total || 0,
                }))
              );
              setInvoiceNotes(quotation.notes || '');
              setInvoiceDiscountAmount(quotation.discountAmount || 0);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to load existing quotation:', error);
    }
  };

  const handleAddInvoiceItemFromPricing = () => {
    if (!selectedPricingService) return;
    const unitPrice = getUnitPriceForService(selectedPricingService) ?? 0;
    const description = selectedPricingService;
    setInvoiceItems([
      ...invoiceItems,
      { description, quantity: 1, unitPrice, total: unitPrice },
    ]);
    setSelectedPricingService('');
  };

  const handleSaveInvoice = async () => {
    if (!selectedBooking?.id) return;
    if (invoiceItems.length === 0 || invoiceItems.some((i) => !i.description.trim())) {
      setInvoiceError('Please add at least one item with a description.');
      return;
    }

    try {
      setInvoiceSaving(true);
      setInvoiceError(null);

      const response = await fetch(`/api/bookings/${selectedBooking.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: invoiceItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
          notes: invoiceNotes,
          discountRate: typeof selectedBooking?.nailTechId === 'string'
            ? (nailTechs.find((t) => t.id === selectedBooking.nailTechId)?.discount || 0)
            : 0,
          discountAmount: invoiceDiscountAmount,
          squeezeInFee: selectedBooking?.slotType === 'with_squeeze_fee' ? 500 : 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create invoice' }));
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const data = await response.json();
      setCurrentQuotationId(data?.quotation?._id || data?.quotation?.id || currentQuotationId);
      alert(currentQuotationId ? 'Invoice updated successfully.' : 'Invoice created successfully.');
      setShowInvoiceModal(false);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      setInvoiceError(error.message || 'Failed to create invoice');
    } finally {
      setInvoiceSaving(false);
    }
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (item: Booking) => {
        const date = new Date(item.date);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      },
    },
    {
      key: 'time',
      header: 'Time',
      render: (item: Booking) => item.time || '-',
    },
    {
      key: 'clientName',
      header: 'Client',
    },
    {
      key: 'socialName',
      header: 'Social Name',
      render: (item: Booking) => item.socialName || '-',
    },
    {
      key: 'service',
      header: 'Service',
    },
    {
      key: 'amountPaid',
      header: 'Amount Paid',
      render: (item: Booking) => (
        <span className="fw-semibold">
          {item.amountPaid && item.amountPaid > 0 ? `₱${item.amountPaid.toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Booking) => <StatusBadge status={item.status} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: Booking) =>
        item.amount ? `₱${item.amount.toLocaleString()}` : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: Booking) => (
        <ActionDropdown
          actions={[
            {
              label: 'View',
              icon: 'bi-eye',
              onClick: () => {
                setSelectedBooking({
                  id: item.id,
                  bookingCode: item.bookingCode,
                  customerId: item.customerId,
                  nailTechId: item.nailTechId,
                  date: item.date,
                  time: item.time,
                  clientName: item.clientName,
                  clientSocialMediaName: item.socialName,
                  service: item.service,
                  status: item.status,
                  slotCount: 1,
                  reservationAmount: 500,
                  paidAmount: item.amountPaid ?? 0,
                  notes: item.clientNotes,
                  adminNotes: item.adminNotes,
                });
                setAdminNotesDraft(item.adminNotes || '');
                setShowModal(true);
              },
            },
            { label: 'Cancel', icon: 'bi-x-circle', variant: 'danger' },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h4 style={{ fontWeight: 600, color: '#212529', margin: 0 }}>
          Bookings & Slots
        </h4>
        <div className="d-flex gap-2 flex-wrap">
          {userRole.canManageAllTechs && !nailTechsLoading && (
            <NailTechFilter
              nailTechs={nailTechs}
              selectedTechId={selectedNailTechId}
              onTechChange={setSelectedNailTechId}
              className="d-none d-md-block"
            />
          )}
          <button
            className="btn btn-dark"
            onClick={() => {
              setAddSlotsError(null);
              setShowAddSlotModal(true);
            }}
            disabled={nailTechsLoading}
          >
            <i className="bi bi-plus-circle me-2"></i>Add Slot
          </button>
        </div>
      </div>

      {/* Mobile Nail Tech Filter */}
      {userRole.canManageAllTechs && !nailTechsLoading && (
        <div className="mb-3 d-md-none">
          <NailTechFilter
            nailTechs={nailTechs}
            selectedTechId={selectedNailTechId}
            onTechChange={setSelectedNailTechId}
          />
        </div>
      )}

      {/* Error Message */}
      {slotsError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {slotsError}
          <button type="button" className="btn-close" onClick={() => setSlotsError(null)}></button>
        </div>
      )}

      {/* Calendar Panel */}
      <div className="row">
        <div className="col-12 col-lg-5" style={{ minWidth: 0 }}>
          <CalendarPanel
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            slots={monthlySlots}
          />
        </div>

        {/* Slot List */}
        <div className="col-12 col-lg-7">
          {slotsLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-dark" role="status">
                <span className="visually-hidden">Loading slots...</span>
              </div>
              <p className="mt-2 text-muted">Loading slots...</p>
            </div>
          ) : (
            <SlotList
              date={selectedDate}
              slots={slots.map((slot) => ({
                ...slot,
                slotType: slot.type,
                nailTechRole: nailTechs.find((t) => t.id === slot.nailTechId)?.role,
              }))}
              onSlotClick={handleSlotClick}
              onView={(slot) => handleSlotClick(slot)}
              onEdit={(slot) => {
                setSelectedSlot(slot);
                setShowEditSlotModal(true);
                setEditSlotError(null);
              }}
              onCancel={(slot) => {
                const bookingStatus = slot.booking?.status;
                if (slot.booking?.id && (bookingStatus === 'pending' || bookingStatus === 'confirmed')) {
                  handleSlotClick(slot);
                  return;
                }

                if (slot.status !== 'available') {
                  setEditSlotError('Only available slots can be deleted. Use booking actions for active bookings.');
                  return;
                }

                handleDeleteSlot(slot);
              }}
            />
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="mt-4">
        <FilterBar
          searchPlaceholder="Search bookings..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={[
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'no_show', label: 'No Show' },
                { value: 'cancelled', label: 'Cancelled' },
              ],
            },
            {
              key: 'dateFrom',
              label: 'Date From',
              type: 'date',
              value: dateFrom,
              onChange: setDateFrom,
            },
            {
              key: 'dateTo',
              label: 'Date To',
              type: 'date',
              value: dateTo,
              onChange: setDateTo,
            },
          ]}
        />

        {bookingsError && (
          <div className="alert alert-danger" role="alert">
            {bookingsError}
          </div>
        )}

        {bookingsLoading ? (
          <div className="text-muted py-4">Loading bookings...</div>
        ) : (
          <>
            <DataTable
              title="All Bookings"
              columns={columns}
              data={paginateBookings(filterBookings(bookings, searchQuery), currentPage, 10)}
              keyExtractor={(item) => item.id}
              emptyMessage="No bookings found"
            />

            <div className="mt-3">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(filterBookings(bookings, searchQuery).length / 10))}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        adminNotesDraft={adminNotesDraft}
        onAdminNotesChange={setAdminNotesDraft}
        onSaveNotes={handleSaveNotes}
        onViewClient={handleViewClientProfile}
        onMarkComplete={() => {
          handleBookingAction('mark_completed');
        }}
        onCancel={() => {
          handleBookingAction('cancel');
        }}
        onReschedule={() => {
          handleBookingAction('reschedule');
        }}
        onMarkNoShow={() => {
          handleBookingAction('mark_no_show');
        }}
        onCreateInvoice={handleCreateInvoice}
        onVerifyPaymentProof={handleVerifyPaymentProof}
        isVerifyingPaymentProof={isVerifyingPaymentProof}
      />

      <InvoiceModal
        show={showInvoiceModal}
        booking={selectedBooking}
        invoiceError={invoiceError}
        invoiceItems={invoiceItems}
        invoiceNotes={invoiceNotes}
        invoiceSaving={invoiceSaving}
        currentQuotationId={currentQuotationId}
        invoiceDiscountAmount={invoiceDiscountAmount}
        pricingData={pricingData}
        selectedPricingService={selectedPricingService}
        pricingLoading={pricingLoading}
        pricingError={pricingError}
        onClose={() => setShowInvoiceModal(false)}
        onSelectedPricingServiceChange={setSelectedPricingService}
        onInvoiceItemsChange={setInvoiceItems}
        onInvoiceNotesChange={setInvoiceNotes}
        onAddFromPricing={handleAddInvoiceItemFromPricing}
        onSave={handleSaveInvoice}
      />
      {/* Add Slot Modal */}
      {showAddSlotModal && (
        <>
          <AddSlotModal
            show={showAddSlotModal}
            onHide={() => {
              if (!addingSlots) {
                setShowAddSlotModal(false);
                setAddSlotsError(null);
              }
            }}
            onAdd={handleAddSlot}
            selectedDate={selectedDate}
            nailTechs={userRole.canManageAllTechs ? nailTechs : nailTechs.filter((t) => t.id === userRole.assignedNailTechId)}
            defaultNailTechId={userRole.assignedNailTechId}
            existingSlots={slots.map((slot) => ({
              date: slot.date,
              time: slot.time,
              nailTechId: slot.nailTechId,
            }))}
          />
          {addingSlots && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div className="text-center text-white">
                <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Creating slots...</span>
                </div>
                <p className="mt-3 fs-5">Creating slots...</p>
              </div>
            </div>
          )}
          {addSlotsError && (
            <div 
              className="position-fixed top-0 start-50 translate-middle-x mt-3"
              style={{ zIndex: 2001 }}
            >
              <div className="alert alert-danger alert-dismissible fade show shadow-lg" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {addSlotsError}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setAddSlotsError(null)}
                ></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Slot Modal */}
      <EditSlotModal
        show={showEditSlotModal}
        onHide={() => {
          if (!editingSlot) {
            setShowEditSlotModal(false);
            setSelectedSlot(null);
            setEditSlotError(null);
          }
        }}
        onUpdate={handleEditSlot}
        onDelete={async () => {
          if (!selectedSlot) return;
          if (selectedSlot.status !== 'available') {
            setEditSlotError('Only available slots can be deleted. Use booking actions for active bookings.');
            return;
          }
          handleDeleteSlot(selectedSlot);
        }}
        slot={selectedSlot ? {
          id: selectedSlot.id,
          date: selectedSlot.date || format(selectedDate, 'yyyy-MM-dd'),
          time: selectedSlot.time,
          status: selectedSlot.status,
          type: selectedSlot.type as 'regular' | 'with_squeeze_fee',
          nailTechId: selectedSlot.nailTechId,
          nailTechName: selectedSlot.nailTechName,
          notes: undefined,
          isHidden: selectedSlot.isHidden,
        } : undefined}
        isLoading={editingSlot}
        error={editSlotError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteConfirmation}
        title="Delete Slot"
        message="Are you sure you want to delete this slot?"
        slotDate={slotToDelete?.date}
        slotTime={slotToDelete?.time}
        nailTechName={slotToDelete?.nailTechName}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirmation(false);
          setSlotToDelete(null);
          setEditSlotError(null);
        }}
        isLoading={isDeletingSlot}
      />
    </div>
  );
}

function filterBookings(rows: Booking[], query: string): Booking[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    row.clientName.toLowerCase().includes(q) ||
    row.service.toLowerCase().includes(q) ||
    row.id.toLowerCase().includes(q)
  );
}

function paginateBookings(rows: Booking[], page: number, pageSize: number): Booking[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}


