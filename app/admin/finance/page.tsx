'use client';

import { useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import StatusBadge, { BookingStatus } from '@/components/admin/StatusBadge';
import FilterBar from '@/components/admin/FilterBar';

interface Transaction {
  id: string;
  date: string;
  clientName: string;
  service: string;
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
}

export default function FinancePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Mock data
  const transactions: Transaction[] = [
    {
      id: '1',
      date: '2024-01-15',
      clientName: 'Sarah Johnson',
      service: 'Russian Manicure',
      amount: 2500,
      paymentStatus: 'paid',
    },
    {
      id: '2',
      date: '2024-01-15',
      clientName: 'Maria Garcia',
      service: 'Nail Art + Pedicure',
      amount: 3500,
      paymentStatus: 'paid',
    },
    {
      id: '3',
      date: '2024-01-14',
      clientName: 'Emily Chen',
      service: 'Gel Extension',
      amount: 4500,
      paymentStatus: 'pending',
    },
    {
      id: '4',
      date: '2024-01-13',
      clientName: 'Jessica Williams',
      service: 'Manicure & Pedicure',
      amount: 2000,
      paymentStatus: 'partial',
    },
  ];

  const todayIncome = transactions
    .filter((t) => t.date === '2024-01-15' && t.paymentStatus === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const weekIncome = transactions
    .filter((t) => t.paymentStatus === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPayments = transactions
    .filter((t) => t.paymentStatus === 'pending' || t.paymentStatus === 'partial')
    .reduce((sum, t) => sum + t.amount, 0);

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
      key: 'amount',
      header: 'Amount',
      render: (item: Transaction) => (
        <span className="fw-semibold">₱{item.amount.toLocaleString()}</span>
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
            value={`₱${todayIncome.toLocaleString()}`}
            subtext="From completed appointments"
            icon="bi-cash-stack"
            iconBgColor="#212529"
            darkBackground={true}
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            title="This Week's Income"
            value={`₱${weekIncome.toLocaleString()}`}
            subtext="Last 7 days"
            icon="bi-calendar-week"
            iconBgColor="#e9ecef"
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            title="Pending Payments"
            value={`₱${pendingPayments.toLocaleString()}`}
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

      <DataTable
        title="Transactions"
        columns={columns}
        data={transactions}
        keyExtractor={(item) => item.id}
        emptyMessage="No transactions found"
      />

      <div className="mt-3">
        <Pagination
          currentPage={currentPage}
          totalPages={3}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
