'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const PAGE_SIZE = 10;

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
  const [statusFilter, setStatusFilter] = useState('all');
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
          today.filter((t: Transaction) => t.paymentStatus === 'paid').reduce((sum: number, t: Transaction) => sum + t.total, 0)
        );
        setWeekIncome(
          week.filter((t: Transaction) => t.paymentStatus === 'paid').reduce((sum: number, t: Transaction) => sum + t.total, 0)
        );
        setPendingPayments(
          week.filter((t: Transaction) => t.paymentStatus === 'pending' || t.paymentStatus === 'partial')
            .reduce((sum: number, t: Transaction) => sum + t.balance, 0)
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

  const filteredTransactions = useMemo(() => {
    let out = filterTransactions(transactions, searchQuery);
    if (statusFilter === 'paid' || statusFilter === 'pending' || statusFilter === 'partial') {
      out = out.filter((t) => t.paymentStatus === statusFilter);
    }
    return out;
  }, [transactions, searchQuery, statusFilter]);

  const paginatedTransactions = useMemo(
    () => paginateTransactions(filteredTransactions, currentPage, PAGE_SIZE),
    [filteredTransactions, currentPage]
  );
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const totalItems = filteredTransactions.length;

  const exportToCsv = () => {
    const headers = ['Date', 'Client', 'Service', 'Total', 'Paid', 'Tip', 'Discount', 'Balance', 'Status'];
    const rows = filteredTransactions.map((t) => [
      t.date ? new Date(t.date).toLocaleDateString('en-CA') : '',
      `"${(t.clientName || '').replace(/"/g, '""')}"`,
      `"${(t.service || '').replace(/"/g, '""')}"`,
      t.total,
      t.paid,
      t.tip,
      t.discount,
      t.balance,
      t.paymentStatus,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPaymentStatusBadge = (status: string) => {
    const cls =
      status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
      status === 'partial' ? 'bg-amber-50 text-amber-700' :
      status === 'pending' ? 'bg-blue-50 text-blue-700' :
      'bg-gray-100 text-gray-500';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Today's Income"
          value={`PHP ${todayIncome.toLocaleString()}`}
          subtext="From completed appointments"
          icon="bi-cash-stack"
          variant="dark"
          className="flex-grow-1"
        />
        <StatCard
          title="This Week's Income"
          iconBgColor="#e9ecef"
          value={`PHP ${weekIncome.toLocaleString()}`}
          subtext="Last 7 days"
          icon="bi-calendar-week"
          className="flex-grow-1"
        />
        <StatCard
          title="Pending Payments"
          iconBgColor="#e9ecef"
          value={`PHP ${pendingPayments.toLocaleString()}`}
          subtext="Awaiting payment"
          icon="bi-clock-history"
          className="flex-grow-1"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Filter Card */}
      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by client or service..."
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
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
              onClick={exportToCsv}
              disabled={filteredTransactions.length === 0}
              className="h-9 px-4 text-sm font-medium rounded-lg border border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa] transition-all flex items-center gap-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export CSV
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
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Client</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Service</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Total</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Paid</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Tip</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Discount</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Balance</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTransactions.length === 0 ? (
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
                  paginatedTransactions.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors duration-100">
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap tabular-nums">
                        {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#1a1a1a]">{item.clientName}</td>
                      <td className="px-5 py-3.5 text-[#1a1a1a]">{item.service}</td>
                      <td className="px-5 py-3.5 font-medium text-[#1a1a1a] tabular-nums">₱{item.total.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-gray-500 tabular-nums">₱{item.paid.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-gray-500 tabular-nums">₱{item.tip.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-gray-500 tabular-nums">₱{item.discount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-gray-500 tabular-nums">₱{item.balance.toLocaleString()}</td>
                      <td className="px-5 py-3.5">{getPaymentStatusBadge(item.paymentStatus)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : paginatedTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                <div className="h-10 w-10 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                  <Search className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">No results found</span>
                <span className="text-xs">Try adjusting your search or filters</span>
              </div>
            ) : (
              paginatedTransactions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-[#1a1a1a]">{item.clientName}</p>
                    {getPaymentStatusBadge(item.paymentStatus)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Service</span>
                      <p className="text-[#1a1a1a]">{item.service}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Total</span>
                      <p className="text-[#1a1a1a] font-medium">₱{item.total.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Paid</span>
                      <p className="text-[#1a1a1a]">₱{item.paid.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Balance</span>
                      <p className="text-[#1a1a1a]">₱{item.balance.toLocaleString()}</p>
                    </div>
                  </div>
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
    </div>
  );
}

function mapBookingToTransaction(booking: any): Transaction {
  const invoiceTotal = booking.invoice?.total ?? booking.pricing?.total ?? 0;
  const paidAmount = booking.pricing?.paidAmount ?? 0;
  const tipAmount = booking.pricing?.tipAmount ?? 0;
  const balance = Math.max(0, invoiceTotal - paidAmount);
  const hasInvoice = Boolean(booking.invoice?.quotationId || booking.invoice?.total != null);
  const paymentStatus =
    hasInvoice && balance <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
  return {
    id: booking.id,
    date: booking.completedAt || booking.createdAt || '',
    clientName: booking.customerName || 'Unknown Client',
    service: booking.service?.type || 'Nail Service',
    total: invoiceTotal,
    paid: paidAmount,
    tip: tipAmount,
    discount: booking.pricing?.discountAmount ?? 0,
    balance,
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


