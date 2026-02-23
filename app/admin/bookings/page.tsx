'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import BookingDetailsModal from '@/components/admin/bookings/BookingDetailsModal';
import InvoiceModal from '@/components/admin/bookings/InvoiceModal';
import AddBookingModal from '@/components/admin/bookings/AddBookingModal';
import ReasonInputDialog from '@/components/admin/ReasonInputDialog';
import MarkCompleteModal from '@/components/admin/bookings/MarkCompleteModal';
import { BookingStatus } from '@/components/admin/StatusBadge';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Search, X, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { usePricing } from '@/lib/hooks/usePricing';
import { useNailTechs } from '@/lib/hooks/useNailTechs';

const PAGE_SIZE = 10;

interface ClientPhoto {
  url?: string;
  publicId?: string;
  uploadedAt?: string;
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
  serviceLocation?: 'homebased_studio' | 'home_service';
  status: BookingStatus;
  amount?: number;
  clientNotes?: string;
  adminNotes?: string;
  socialName?: string;
  amountPaid?: number;
  clientPhotos?: { inspiration: ClientPhoto[]; currentState: ClientPhoto[] };
  paymentProofUrl?: string;
  slotTimes?: string[];
  invoice?: { quotationId?: string; total?: number; createdAt?: string } | null;
  completedAt?: string | null;
}

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [pendingBookingAction, setPendingBookingAction] = useState<'cancel' | 'reschedule' | 'mark_no_show' | null>(null);
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
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
    amount?: number;
    paidAmount?: number;
    depositRequired?: number;
    paymentProofUrl?: string;
    clientPhotos?: { inspiration: { url?: string }[]; currentState: { url?: string }[] };
    slotTimes?: string[];
    invoice?: { quotationId?: string; total?: number; createdAt?: string } | null;
    completedAt?: string | null;
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
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);

  const { getUnitPriceForService } = usePricing(pricingData, pricingHeaders);
  const { nailTechs, loading: nailTechsLoading } = useNailTechs();

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


  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      setBookingsError(null);
      const params = new URLSearchParams();
      const urlCustomerId = searchParams.get('customerId');
      const urlTechId = searchParams.get('techId') || searchParams.get('nailTechId');
      if (urlCustomerId) params.set('customerId', urlCustomerId);
      if (urlTechId) params.set('nailTechId', urlTechId);
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
          serviceLocation: booking.service?.location,
          status: booking.status || 'booked',
          amount: booking.pricing?.total || 0,
          amountPaid: booking.pricing?.paidAmount || 0,
          clientNotes: booking.clientNotes || '',
          adminNotes: booking.adminNotes || '',
          clientPhotos: booking.clientPhotos || { inspiration: [], currentState: [] },
          paymentProofUrl: booking.payment?.paymentProofUrl,
          slotTimes: booking.appointmentTimes || (apptTime ? [apptTime] : []),
          invoice: booking.invoice || null,
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
  }, [statusFilter, dateFrom, dateTo, searchParams]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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
          completedAt: b.completedAt ?? prev.completedAt,
        } : null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [showModal, selectedBooking?.id]);


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
      // Refresh bookings list
      const params = new URLSearchParams();
      const urlCustomerId = searchParams.get('customerId');
      const urlTechId = searchParams.get('techId') || searchParams.get('nailTechId');
      if (urlCustomerId) params.set('customerId', urlCustomerId);
      if (urlTechId) params.set('nailTechId', urlTechId);
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter as any);
      }
      if (dateFrom) params.set('startDate', dateFrom);
      if (dateTo) params.set('endDate', dateTo);

      const refreshResponse = await fetch(`/api/bookings?${params.toString()}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
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
            serviceLocation: booking.service?.location,
            status: booking.status || 'booked',
            amount: booking.pricing?.total || 0,
            amountPaid: booking.pricing?.paidAmount || 0,
            clientNotes: booking.clientNotes || '',
            adminNotes: booking.adminNotes || '',
            clientPhotos: booking.clientPhotos || { inspiration: [], currentState: [] },
            paymentProofUrl: booking.payment?.paymentProofUrl,
            slotTimes: booking.appointmentTimes || (booking.appointmentTime ? [booking.appointmentTime] : []),
            invoice: booking.invoice || null,
            completedAt: booking.completedAt || null,
          };
        });
        setBookings(rows);
      }
    } catch (error: any) {
      console.error(`Error performing booking action (${action}):`, error);
      toast.error(error.message || 'Failed to update booking');
    }
  };

  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const handleMarkCompleted = async (amountReceived: number, tipFromExcess: number) => {
    if (!selectedBooking?.id) return;
    const total = selectedBooking.amount ?? selectedBooking.invoice?.total ?? 0;
    const currentPaid = selectedBooking.paidAmount ?? 0;
    const remaining = Math.max(0, total - currentPaid);
    const appliedToBalance = Math.min(amountReceived, remaining);
    const finalPaidAmount = currentPaid + appliedToBalance;
    const currentTip = (selectedBooking as { tipAmount?: number }).tipAmount ?? 0;
    const finalTipAmount = currentTip + tipFromExcess;
    try {
      setIsMarkingComplete(true);
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_completed',
          paidAmount: finalPaidAmount,
          tipAmount: finalTipAmount,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to mark completed' }));
        throw new Error(errorData.error || 'Failed to mark completed');
      }
      setShowMarkCompleteModal(false);
      setShowModal(false);
      setSelectedBooking(null);
      toast.success('Booking marked as completed');
      const params = new URLSearchParams();
      const urlCustomerId = searchParams.get('customerId');
      const urlTechId = searchParams.get('techId') || searchParams.get('nailTechId');
      if (urlCustomerId) params.set('customerId', urlCustomerId);
      if (urlTechId) params.set('nailTechId', urlTechId);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter as any);
      if (dateFrom) params.set('startDate', dateFrom);
      if (dateTo) params.set('endDate', dateTo);
      const refreshResponse = await fetch(`/api/bookings?${params.toString()}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
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
            serviceLocation: booking.service?.location,
            status: booking.status || 'booked',
            amount: booking.pricing?.total || 0,
            amountPaid: booking.pricing?.paidAmount || 0,
            clientNotes: booking.clientNotes || '',
            adminNotes: booking.adminNotes || '',
            clientPhotos: booking.clientPhotos || { inspiration: [], currentState: [] },
            paymentProofUrl: booking.payment?.paymentProofUrl,
            slotTimes: booking.appointmentTimes || (booking.appointmentTime ? [booking.appointmentTime] : []),
            invoice: booking.invoice || null,
            completedAt: booking.completedAt || null,
          };
        });
        setBookings(rows);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark completed');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleBookingAction = (action: 'cancel' | 'reschedule' | 'mark_no_show' | 'mark_completed') => {
    if (action === 'mark_completed') {
      setShowMarkCompleteModal(true);
    } else {
      openReasonDialog(action);
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

      toast.success('Payment verified and booking confirmed');
      // Refresh bookings will happen via useEffect
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
      // Refresh bookings will happen via useEffect
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast.error(error.message || 'Failed to save notes');
    }
  };

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
      const newQuotationId = data?.quotation?._id || data?.quotation?.id || currentQuotationId;
      setCurrentQuotationId(newQuotationId);
      toast.success(currentQuotationId ? 'Invoice updated successfully.' : 'Invoice created successfully.');
      setShowInvoiceModal(false);
      if (selectedBooking && data?.booking?.invoice) {
        setSelectedBooking({ ...selectedBooking, invoice: data.booking.invoice });
      }
      fetchBookings();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      setInvoiceError(error.message || 'Failed to create invoice');
    } finally {
      setInvoiceSaving(false);
    }
  };

  const filteredBookings = filterBookings(bookings, searchQuery);
  const paginatedBookings = paginateBookings(filteredBookings, currentPage, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const totalItems = filteredBookings.length;

  const getStatusBadge = (status: BookingStatus) => {
    const cls =
      status === 'completed' ? 'bg-orange-50 text-orange-700' :
      status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
      status === 'pending' || status === 'booked' ? 'bg-amber-50 text-amber-700' :
      status === 'cancelled' ? 'bg-red-50 text-red-600' :
      status === 'no_show' ? 'bg-gray-100 text-gray-500' :
      'bg-gray-100 text-gray-500';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
        {(status || '').replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {bookingsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {bookingsError}
        </div>
      )}

      {/* Filter Card */}
      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-0 sm:min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 text-sm rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 min-w-0 sm:min-w-[140px] h-9 px-3">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 flex-1 min-w-0 sm:min-w-[140px]">
              <label className="text-xs text-gray-400 whitespace-nowrap shrink-0">Date range</label>
              <DateRangePicker
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                placeholder="From – To"
                compact
                className="flex-1 min-w-0"
              />
            </div>
            {(searchQuery || statusFilter !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="h-9 px-3 text-sm rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all flex items-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            <button
              onClick={() => setShowAddBookingModal(true)}
              className="h-9 px-4 text-sm font-medium rounded-lg bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-colors flex items-center justify-center gap-2 ml-auto"
            >
              <Plus className="h-4 w-4" />
              Add Booking
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0f0f0]" style={{ background: 'linear-gradient(to right, #fafafa, #f5f5f5)' }}>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Time</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Client</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Social Name</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Service</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Amount Paid</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {bookingsLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <div className="h-10 w-10 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                          <Search className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">No results found</span>
                        <span className="text-xs">Try adjusting your search or filters</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors duration-100 group">
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap tabular-nums">
                        {item.date ? (() => {
                          const d = new Date(item.date);
                          return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        })() : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{item.time || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-[#1a1a1a]">{item.clientName}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{item.socialName || '—'}</td>
                      <td className="px-5 py-3.5 text-[#1a1a1a]">{item.service}</td>
                      <td className="px-5 py-3.5 font-medium text-[#1a1a1a] tabular-nums">
                        {item.amountPaid && item.amountPaid > 0 ? `₱${item.amountPaid.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(item.status)}</td>
                      <td className="px-5 py-3.5 font-medium text-[#1a1a1a] tabular-nums">
                        {item.amount ? `₱${item.amount.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
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
                                serviceLocation: item.serviceLocation,
                                status: item.status,
                                slotCount: 1,
                                reservationAmount: 500,
                                amount: item.amount,
                                paidAmount: item.amountPaid ?? 0,
                                notes: item.clientNotes,
                                adminNotes: item.adminNotes,
                                clientPhotos: item.clientPhotos,
                                paymentProofUrl: item.paymentProofUrl,
                                slotTimes: item.slotTimes,
                                invoice: item.invoice,
                                completedAt: item.completedAt,
                              });
                              setAdminNotesDraft(item.adminNotes || '');
                              setShowModal(true);
                            }}
                            className="h-7 px-2.5 text-xs rounded-md border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden p-4 space-y-3">
            {bookingsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : paginatedBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                <div className="h-10 w-10 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                  <Search className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">No results found</span>
                <span className="text-xs">Try adjusting your search or filters</span>
              </div>
            ) : (
              paginatedBookings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#1a1a1a]">{item.clientName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.date ? (() => {
                          const d = new Date(item.date);
                          return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        })() : '—'} · {item.time || '—'}
                      </p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Service</span>
                      <p className="text-[#1a1a1a]">{item.service}</p>
                    </div>
                    {item.socialName && (
                      <div>
                        <span className="text-gray-400 text-xs">Social</span>
                        <p className="text-[#1a1a1a] truncate">{item.socialName}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 text-xs">Amount</span>
                      <p className="text-[#1a1a1a] font-medium">{item.amount ? `₱${item.amount.toLocaleString()}` : '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Paid</span>
                      <p className="text-[#1a1a1a]">{item.amountPaid && item.amountPaid > 0 ? `₱${item.amountPaid.toLocaleString()}` : '—'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
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
                        amount: item.amount,
                        paidAmount: item.amountPaid ?? 0,
                        notes: item.clientNotes,
                        adminNotes: item.adminNotes,
                        clientPhotos: item.clientPhotos,
                        paymentProofUrl: item.paymentProofUrl,
                        slotTimes: item.slotTimes,
                        invoice: item.invoice,
                        completedAt: item.completedAt,
                      });
                      setAdminNotesDraft(item.adminNotes || '');
                      setShowModal(true);
                    }}
                    className="w-full h-10 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-sm font-medium text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa] transition-all"
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          <p className="text-xs text-gray-400 order-2 sm:order-1">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end order-1 sm:order-2">
            <span className="sm:hidden text-xs text-gray-500">Page {currentPage} / {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-9 min-w-[44px] flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm px-2"><ChevronLeft className="h-4 w-4" /></button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg border text-xs font-medium transition-all ${currentPage === page ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-sm' : 'border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'}`}
                    >{page}</button>
                  );
                })}
              </div>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-9 min-w-[44px] flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm px-2"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

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

      <MarkCompleteModal
        open={showMarkCompleteModal}
        onOpenChange={setShowMarkCompleteModal}
        balanceDue={Math.max(0, (selectedBooking?.amount ?? selectedBooking?.invoice?.total ?? 0) - (selectedBooking?.paidAmount ?? 0))}
        onConfirm={handleMarkCompleted}
        isLoading={isMarkingComplete}
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

      <AddBookingModal
        open={showAddBookingModal}
        onClose={() => setShowAddBookingModal(false)}
        onSuccess={() => {
          toast.success('Booking created successfully');
          fetchBookings();
        }}
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


