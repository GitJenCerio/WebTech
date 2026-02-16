'use client';

import { useState, useEffect, useCallback } from 'react';
import BookingDetailsModal from '@/components/admin/bookings/BookingDetailsModal';
import InvoiceModal from '@/components/admin/bookings/InvoiceModal';
import DataTable from '@/components/admin/DataTable';
import FilterBar from '@/components/admin/FilterBar';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import ActionDropdown from '@/components/admin/ActionDropdown';
import { BookingStatus } from '@/components/admin/StatusBadge';
import { useUserRole } from '@/lib/hooks/useUserRole';

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
          Bookings
        </h4>
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


