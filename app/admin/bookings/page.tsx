'use client';

import { useState, useEffect, useCallback } from 'react';
import BookingDetailsModal from '@/components/admin/bookings/BookingDetailsModal';
import InvoiceModal from '@/components/admin/bookings/InvoiceModal';
import { BookingStatus } from '@/components/admin/StatusBadge';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const PAGE_SIZE = 10;

function cleanCurrencyValue(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.\\-]/g, '').trim();
  return parseFloat(cleaned) || 0;
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
  const [showModal, setShowModal] = useState(false);
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
      
      // Refresh bookings list
      const params = new URLSearchParams();
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
            status: booking.status || 'booked',
            amount: booking.pricing?.total || 0,
            amountPaid: booking.pricing?.paidAmount || 0,
            clientNotes: booking.clientNotes || '',
            adminNotes: booking.adminNotes || '',
          };
        });
        setBookings(rows);
      }
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

      // Refresh bookings will happen via useEffect
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
      // Refresh bookings will happen via useEffect
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

  const filteredBookings = filterBookings(bookings, searchQuery);
  const paginatedBookings = paginateBookings(filteredBookings, currentPage, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const totalItems = filteredBookings.length;

  const getStatusBadge = (status: BookingStatus) => {
    const cls =
      status === 'completed' || status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Bookings</h1>
          <p className="text-sm text-gray-400 mt-0.5">View and manage all appointments</p>
        </div>
      </div>

      {bookingsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {bookingsError}
        </div>
      )}

      {/* Filter Card */}
      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="no_show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 whitespace-nowrap">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 px-3 text-sm rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 whitespace-nowrap">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 px-3 text-sm rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all"
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
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                                status: item.status,
                                slotCount: 1,
                                reservationAmount: 500,
                                paidAmount: item.amountPaid ?? 0,
                                notes: item.clientNotes,
                                adminNotes: item.adminNotes,
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
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-400">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                    currentPage === page ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-sm' : 'border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
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


