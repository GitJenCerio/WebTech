'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import StatusBadge, { BookingStatus } from '@/components/admin/StatusBadge';
import FilterBar from '@/components/admin/FilterBar';
import { Alert, AlertDescription } from '@/components/ui/Alert';

interface Transaction {
  id: string;
  date: string;
  clientName: string;
  service: string;
  total: number;
  paid: number;
  tip: number;
  discount: number;
  balance: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
}

export default function FinancePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayIncome, setTodayIncome] = useState(0);
  const [weekIncome, setWeekIncome] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const [todayRes, weekRes] = await Promise.all([
          fetch('/api/bookings?range=today'),
          fetch('/api/bookings?range=week'),
        ]);
        if (!todayRes.ok || !weekRes.ok) throw new Error('Failed to fetch finance summary');

        const todayData = await todayRes.json();
        const weekData = await weekRes.json();

        const today = (todayData.bookings || []).map(mapBookingToTransaction);
        const week = (weekData.bookings || []).map(mapBookingToTransaction);

        setTodayIncome(
          today.filter(t => t.paymentStatus === 'paid').reduce((sum, t) => sum + t.total, 0)
        );
        setWeekIncome(
          week.filter(t => t.paymentStatus === 'paid').reduce((sum, t) => sum + t.total, 0)
        );
        setPendingPayments(
          week.filter(t => t.paymentStatus === 'pending' || t.paymentStatus === 'partial')
            .reduce((sum, t) => sum + t.balance, 0)
        );
      } catch (err: any) {
        console.error('Finance summary error:', err);
      }
    }

    fetchSummary();
  }, []);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (dateFrom) params.set('startDate', dateFrom);
        if (dateTo) params.set('endDate', dateTo);
        if (!dateFrom && !dateTo) params.set('range', 'month');

        const response = await fetch(`/api/bookings?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();

        const rows: Transaction[] = (data.bookings || []).map(mapBookingToTransaction);
        setTransactions(rows);
        setCurrentPage(1);
      } catch (err: any) {
        console.error('Finance transactions error:', err);
        setError(err.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [dateFrom, dateTo]);

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: BookingStatus }> = {
      paid: { label: 'Paid', variant: 'completed' },
      pending: { label: 'Pending', variant: 'booked' },
      partial: { label: 'Partial', variant: 'booked' },
    };
    const config = statusMap[status] || { label: status, variant: 'booked' as BookingStatus };
    return <StatusBadge status={config.variant} />;
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (item: Transaction) => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      },
    },
    {
      key: 'clientName',
      header: 'Client',
    },
    {
      key: 'service',
      header: 'Service',
    },
    {
      key: 'total',
      header: 'Total',
      render: (item: Transaction) => (
        <span className="fw-semibold">PHP {item.total.toLocaleString()}</span>
      ),
    },
    {
      key: 'paid',
      header: 'Paid',
      render: (item: Transaction) => (
        <span>PHP {item.paid.toLocaleString()}</span>
      ),
    },
    {
      key: 'tip',
      header: 'Tip',
      render: (item: Transaction) => (
        <span>PHP {item.tip.toLocaleString()}</span>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (item: Transaction) => (
        <span>PHP {item.discount.toLocaleString()}</span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (item: Transaction) => (
        <span>PHP {item.balance.toLocaleString()}</span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      render: (item: Transaction) => getPaymentStatusBadge(item.paymentStatus),
    },
  ];

  return (
    <div>
      <h4 className="mb-4" style={{ fontWeight: 600, color: '#212529' }}>
        Finance
      </h4>

      {/* Summary Cards */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <StatCard
            title="Today's Income"
            value={`PHP ${todayIncome.toLocaleString()}`}
            subtext="From completed appointments"
            icon="bi-cash-stack"
            iconBgColor="#212529"
            darkBackground={true}
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            title="This Week's Income"
            value={`PHP ${weekIncome.toLocaleString()}`}
            subtext="Last 7 days"
            icon="bi-calendar-week"
            iconBgColor="#e9ecef"
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            title="Pending Payments"
            value={`PHP ${pendingPayments.toLocaleString()}`}
            subtext="Awaiting payment"
            icon="bi-clock-history"
            iconBgColor="#e9ecef"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <FilterBar
        searchPlaceholder="Search transactions..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
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

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted py-4">Loading transactions...</div>
      ) : (
        <>
          <DataTable
            title="Transactions"
            columns={columns}
            data={paginateTransactions(filterTransactions(transactions, searchQuery), currentPage, 10)}
            keyExtractor={(item) => item.id}
            emptyMessage="No transactions found"
          />

          <div className="mt-3">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(filterTransactions(transactions, searchQuery).length / 10))}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  );
}

function mapBookingToTransaction(booking: any): Transaction {
  const paymentStatus =
    booking.paymentStatus === 'paid'
      ? 'paid'
      : booking.paymentStatus === 'partial'
        ? 'partial'
        : 'pending';
  return {
    id: booking.id,
    date: booking.completedAt || booking.createdAt || '',
    clientName: booking.customerName || 'Unknown Client',
    service: booking.service?.type || 'Nail Service',
    total: (booking.invoice?.total ?? booking.pricing?.total ?? 0) + (booking.pricing?.tipAmount ?? 0),
    paid: (booking.pricing?.paidAmount ?? 0) + (booking.pricing?.tipAmount ?? 0),
    tip: booking.pricing?.tipAmount ?? 0,
    discount: booking.pricing?.discountAmount ?? 0,
    balance: Math.max(
      0,
      ((booking.invoice?.total ?? booking.pricing?.total ?? 0) + (booking.pricing?.tipAmount ?? 0)) -
        ((booking.pricing?.paidAmount ?? 0) + (booking.pricing?.tipAmount ?? 0))
    ),
    paymentStatus,
  };
}

function filterTransactions(rows: Transaction[], query: string): Transaction[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    row.clientName.toLowerCase().includes(q) ||
    row.service.toLowerCase().includes(q) ||
    row.id.toLowerCase().includes(q)
  );
}

function paginateTransactions(rows: Transaction[], page: number, pageSize: number): Transaction[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}


