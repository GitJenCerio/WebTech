'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import CalendarPanel from '@/components/admin/bookings/CalendarPanel';
import SlotList from '@/components/admin/bookings/SlotList';
import BookingDetailsModal from '@/components/admin/bookings/BookingDetailsModal';
import InvoiceModal from '@/components/admin/bookings/InvoiceModal';
import AddSlotModal from '@/components/admin/bookings/AddSlotModal';
import EditSlotModal from '@/components/admin/bookings/EditSlotModal';
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal';
import ReasonInputDialog from '@/components/admin/ReasonInputDialog';
import { BookingStatus } from '@/components/admin/StatusBadge';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { usePricing } from '@/lib/hooks/usePricing';
import { useNailTechs } from '@/lib/hooks/useNailTechs';
import { format } from 'date-fns';

function getTechIdFromQuery(searchParams: URLSearchParams): string | null {
  return searchParams.get('techId');
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
    service?: { type?: string; location?: 'homebased_studio' | 'home_service' };
    status: string;
    paymentStatus?: string;
    pricing?: { total?: number; depositRequired?: number; paidAmount?: number };
    payment?: { paymentProofUrl?: string };
    clientNotes?: string;
    adminNotes?: string;
  } | null;
}

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = useUserRole();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [pendingBookingAction, setPendingBookingAction] = useState<'cancel' | 'reschedule' | 'mark_no_show' | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedNailTechId, setSelectedNailTechId] = useState<string>('all');

  // Sync selected tech when staff has assigned nail tech (session loads async)
  useEffect(() => {
    if (userRole.assignedNailTechId) {
      setSelectedNailTechId(userRole.assignedNailTechId);
    } else if (!userRole.assignedNailTechId && userRole.canManageAllTechs) {
      const fromQuery = searchParams.get('techId');
      if (fromQuery) setSelectedNailTechId(fromQuery);
    }
  }, [userRole.assignedNailTechId, userRole.canManageAllTechs, searchParams]);
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
    serviceLocation?: 'homebased_studio' | 'home_service';
    status: BookingStatus;
    notes?: string;
    adminNotes?: string;
    paymentStatus?: string;
    slotCount?: number;
    reservationAmount?: number;
    paidAmount?: number;
    depositRequired?: number;
    paymentProofUrl?: string;
    clientPhotos?: { inspiration?: Array<{ url?: string }>; currentState?: Array<{ url?: string }> };
    slotTimes?: string[];
    invoice?: { quotationId?: string; total?: number; createdAt?: string } | null;
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

  const { getUnitPriceForService } = usePricing(pricingData, pricingHeaders);
  const { nailTechs, loading: nailTechsLoading } = useNailTechs();

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

  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

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
          clientPhotos: slot.booking.clientPhotos,
        }
      : null,
  }), [mapSlotStatus, nailTechs]);

  useEffect(() => {
    const techId = getTechIdFromQuery(searchParams);
    if (techId && techId !== selectedNailTechId) {
      setSelectedNailTechId(techId);
    }
  }, [selectedNailTechId, searchParams]);

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

  const refreshMonthlySlots = useCallback(async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
    const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
    const params = new URLSearchParams({ startDate, endDate });
    if (selectedNailTechId && selectedNailTechId !== 'all') {
      params.append('nailTechId', selectedNailTechId);
    }
    const response = await fetch(`/api/slots?${params}`);
    if (response.ok) {
      const data = await response.json();
      setMonthlySlots(data.slots.map((slot: any) => ({
        ...mapApiSlotToViewSlot(slot),
        nailTechName: undefined,
        service: undefined,
        booking: null,
      })));
    }
  }, [currentMonth, selectedNailTechId, mapApiSlotToViewSlot]);

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

      await refreshSelectedDateSlots();

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

      await refreshSelectedDateSlots();
      await refreshMonthlySlots();
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
      await refreshMonthlySlots();
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

  const handleSlotClick = (slot: Slot) => {
    if (slot.booking?.id && slot.clientName) {
      const bookingSlotTimes = slots
        .filter((s) => s.booking?.id === slot.booking?.id)
        .map((s) => s.time)
        .filter(Boolean)
        .sort((a, b) => (a || '').localeCompare(b || '', undefined, { numeric: true }));
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
        slotTimes: bookingSlotTimes.length > 0 ? bookingSlotTimes : undefined,
        clientName: slot.clientName,
        clientEmail: slot.booking?.customerEmail,
        clientPhone: slot.booking?.customerPhone,
        clientSocialMediaName: slot.booking?.customerSocialMediaName,
        service: slot.service || 'Nail Service',
        serviceLocation: slot.booking?.service?.location,
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
        clientPhotos: slot.booking?.clientPhotos,
        invoice: slot.booking?.invoice || null,
      });
      setAdminNotesDraft(slot.booking?.adminNotes || '');
      setShowModal(true);
    }
  };

  const handleViewClientProfile = () => {
    if (!selectedBooking?.customerId) return;
    router.push(`/admin/clients?customerId=${selectedBooking.customerId}`);
  };

  const openReasonDialog = (action: 'cancel' | 'reschedule' | 'mark_no_show') => {
    setPendingBookingAction(action);
    setReasonDialogOpen(true);
  };

  const handleReasonConfirm = (reason: string) => {
    if (pendingBookingAction && selectedBooking?.id) {
      handleBookingActionWithReason(pendingBookingAction, reason);
    }
    setPendingBookingAction(null);
  };

  const handleBookingActionWithReason = async (
    action: 'cancel' | 'reschedule' | 'mark_no_show',
    reason: string
  ) => {
    if (!selectedBooking?.id) return;
    try {
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
      toast.success('Booking updated');
      await refreshSelectedDateSlots();
      await refreshMonthlySlots();
    } catch (error: any) {
      console.error(`Error performing booking action (${action}):`, error);
      toast.error(error.message || 'Failed to update booking');
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedBooking?.id) return;
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_completed' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to mark completed' }));
        throw new Error(errorData.error || 'Failed to mark completed');
      }
      setShowModal(false);
      setSelectedBooking(null);
      toast.success('Booking marked as completed');
      await refreshSelectedDateSlots();
      await refreshMonthlySlots();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark completed');
    }
  };

  const handleBookingAction = (action: 'cancel' | 'reschedule' | 'mark_no_show' | 'mark_completed') => {
    if (action === 'mark_completed') {
      handleMarkCompleted();
    } else {
      openReasonDialog(action);
    }
  };

  const handleVerifyPaymentProof = async () => {
    if (!selectedBooking?.id) return;

    try {
      setIsVerifyingPaymentProof(true);

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
      await refreshMonthlySlots();
    } catch (error: any) {
      console.error('Error verifying payment proof:', error);
      toast.error(error.message || 'Failed to verify payment proof');
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
      toast.success('Notes saved');
      await refreshSelectedDateSlots();
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast.error(error.message || 'Failed to save notes');
    }
  };

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

  // Fetch latest booking when details modal opens so we have fresh invoice data
  useEffect(() => {
    if (!showModal || !selectedBooking?.id) return;
    let cancelled = false;
    fetch(`/api/bookings/${selectedBooking.id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (cancelled || !data?.booking) return;
        const b = data.booking;
        setSelectedBooking((prev) => prev ? {
          ...prev,
          invoice: b.invoice ?? prev.invoice,
          paymentStatus: b.paymentStatus ?? prev.paymentStatus,
          adminNotes: b.adminNotes ?? prev.adminNotes,
        } : null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [showModal, selectedBooking?.id]);

  const handleCreateInvoice = async () => {
    if (!selectedBooking?.id) return;
    setInvoiceError(null);
    setInvoiceNotes('');
    setInvoiceDiscountAmount(0);
    setInvoiceItems([]);
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

  const handleAddInvoiceItemFromPricing = (serviceName?: string) => {
    const name = serviceName ?? selectedPricingService;
    if (!name) return;
    const unitPrice = getUnitPriceForService(name) ?? 0;
    const description = name;
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
      toast.success(currentQuotationId ? 'Invoice updated successfully.' : 'Invoice created successfully.');
      setShowInvoiceModal(false);
      if (selectedBooking && data?.booking?.invoice) {
        setSelectedBooking({ ...selectedBooking, invoice: data.booking.invoice });
      }
      await refreshSelectedDateSlots();
      await refreshMonthlySlots();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      setInvoiceError(error.message || 'Failed to create invoice');
    } finally {
      setInvoiceSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      {/* Error Message */}
      {slotsError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {slotsError}
          <button type="button" className="btn-close" onClick={() => setSlotsError(null)}></button>
        </div>
      )}

      {/* Calendar Panel + Slot List - stack on xs/sm, side-by-side on lg+ */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-3" style={{ alignItems: 'stretch' }}>
        <div className="w-full lg:flex-[2] xl:flex-[3] flex min-w-0 order-2 lg:order-1">
          <div className="w-full" style={{ minHeight: 0 }}>
          <CalendarPanel
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onViewChange={setCalendarView}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            slots={monthlySlots}
            daySlots={slots}
            onSlotClick={(slot) => handleSlotClick(slot as Slot)}
            onAddAvailability={() => {
              setAddSlotsError(null);
              setShowAddSlotModal(true);
            }}
            nailTechs={nailTechs}
            selectedNailTechId={selectedNailTechId}
            onNailTechChange={setSelectedNailTechId}
            showNailTechFilter={userRole.canManageAllTechs && !nailTechsLoading}
          />
          </div>
        </div>

        {/* Slot List - hidden in day view (slots shown in calendar panel) */}
        {calendarView !== 'day' && (
        <div className="w-full lg:flex-1 flex min-w-0 order-1 lg:order-2">
          <div className="w-full" style={{ minHeight: 0 }}>
          {slotsLoading ? (
            <div className="rounded-2xl border border-[#e5e5e5] bg-white flex items-center justify-center min-h-[400px]">
              <div className="text-center py-5">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a1a1a] border-t-transparent mx-auto" role="status" aria-label="Loading" />
                <p className="mt-2 text-sm text-gray-500">Loading slots...</p>
              </div>
            </div>
          ) : (
            <SlotList
              date={selectedDate}
              slots={slots.map((slot) => ({
                ...slot,
                slotType: slot.type,
                nailTechRole: nailTechs.find((t) => t.id === slot.nailTechId)?.role,
                serviceLocation: (slot as Slot).booking?.service?.location as 'homebased_studio' | 'home_service' | undefined,
              }))}
              onSlotClick={(slot) => handleSlotClick(slot as Slot)}
              onView={(slot) => handleSlotClick(slot as Slot)}
              onEdit={(slot) => {
                setSelectedSlot(slot as Slot);
                setShowEditSlotModal(true);
                setEditSlotError(null);
              }}
              onCancel={(slot) => {
                const s = slot as Slot;
                const bookingStatus = s.booking?.status;
                if (s.booking?.id && (bookingStatus === 'pending' || bookingStatus === 'confirmed')) {
                  handleSlotClick(s);
                  return;
                }

                if (s.status !== 'available') {
                  setEditSlotError('Only available slots can be deleted. Use booking actions for active bookings.');
                  return;
                }

                handleDeleteSlot(s);
              }}
            />
          )}
          </div>
        </div>
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

      <ReasonInputDialog
        open={reasonDialogOpen}
        onOpenChange={(open) => {
          setReasonDialogOpen(open);
          if (!open) setPendingBookingAction(null);
        }}
        title={
          pendingBookingAction === 'cancel'
            ? 'Cancel booking'
            : pendingBookingAction === 'reschedule'
              ? 'Reschedule booking'
              : 'Mark as no show'
        }
        description={
          pendingBookingAction === 'cancel'
            ? 'Please enter the reason for cancelling this booking.'
            : pendingBookingAction === 'reschedule'
              ? 'Please enter the reason for rescheduling this booking.'
              : 'Please enter the reason for marking this as no show.'
        }
        placeholder="Enter reason..."
        confirmLabel={pendingBookingAction === 'reschedule' ? 'Reschedule' : 'Confirm'}
        onConfirm={handleReasonConfirm}
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
            existingSlots={slots
              .filter((slot): slot is Slot & { date: string; nailTechId: string } =>
                !!slot.date && !!slot.nailTechId
              )
              .map((slot) => ({
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
