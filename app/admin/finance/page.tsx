'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Download, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNailTechs } from '@/lib/hooks/useNailTechs';
import StatCard from '@/components/admin/StatCard';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTime12Hour, sortTimesChronologically } from '@/lib/utils';

const PAGE_SIZE = 10;

interface Transaction {
  id: string;
  date: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentTimes: string[];
  clientName: string;
  customerSocialMediaName: string;
  service: string;
  serviceLocation?: 'homebased_studio' | 'home_service';
  total: number;
  paid: number;
  tip: number;
  discount: number;
  balance: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  nailTechId?: string;
}

function formatSlotTimes(slotTimes: string[] | undefined, fallback: string): string {
  if (!slotTimes?.length) return fallback ? formatTime12Hour(fallback) : '—';
  return sortTimesChronologically(slotTimes).map(formatTime12Hour).join(', ');
}

function serviceLocationBadge(loc?: 'homebased_studio' | 'home_service') {
  if (loc !== 'home_service' && loc !== 'homebased_studio') return null;
  const label = loc === 'home_service' ? 'HS' : 'ST';
  const isHS = loc === 'home_service';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${isHS ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
      {label}
    </span>
  );
}

export default function FinancePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nailTechFilter, setNailTechFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickSelect, setQuickSelect] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todaySummaryTransactions, setTodaySummaryTransactions] = useState<Transaction[]>([]);
  const [weekSummaryTransactions, setWeekSummaryTransactions] = useState<Transaction[]>([]);
  const [adminCommissionRate, setAdminCommissionRate] = useState(10);
  const { nailTechs } = useNailTechs();

  useEffect(() => {
    async function fetchSummary() {
      try {
        const [todayRes, weekRes, settingsRes] = await Promise.all([
          fetch('/api/bookings?range=today'),
          fetch('/api/bookings?range=week'),
          fetch('/api/settings'),
        ]);
        if (!todayRes.ok || !weekRes.ok) throw new Error('Failed to fetch finance summary');
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setAdminCommissionRate(s.adminCommissionRate ?? 10);
        }

        const todayData = await todayRes.json();
        const weekData = await weekRes.json();

        const today = (todayData.bookings || []).map(mapBookingToTransaction);
        const week = (weekData.bookings || []).map(mapBookingToTransaction);

        setTodaySummaryTransactions(today);
        setWeekSummaryTransactions(week);
      } catch (err: any) {
        console.error('Finance summary error:', err);
      }
    }

    fetchSummary();
  }, []);

  const todayFiltered = useMemo(() => {
    if (nailTechFilter === 'all') return todaySummaryTransactions;
    return todaySummaryTransactions.filter((t) => t.nailTechId === nailTechFilter);
  }, [todaySummaryTransactions, nailTechFilter]);

  const weekFiltered = useMemo(() => {
    if (nailTechFilter === 'all') return weekSummaryTransactions;
    return weekSummaryTransactions.filter((t) => t.nailTechId === nailTechFilter);
  }, [weekSummaryTransactions, nailTechFilter]);

  const todayIncome = useMemo(
    () => todayFiltered.filter((t) => t.paymentStatus === 'paid').reduce((sum, t) => sum + t.total, 0),
    [todayFiltered]
  );

  const weekIncome = useMemo(
    () => weekFiltered.filter((t) => t.paymentStatus === 'paid').reduce((sum, t) => sum + t.total, 0),
    [weekFiltered]
  );

  const pendingPayments = useMemo(
    () =>
      weekFiltered
        .filter((t) => t.paymentStatus === 'pending' || t.paymentStatus === 'partial')
        .reduce((sum, t) => sum + t.balance, 0),
    [weekFiltered]
  );

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (dateFrom) params.set('startDate', dateFrom);
        if (dateTo) params.set('endDate', dateTo);
        if (!dateFrom && !dateTo && quickSelect !== 'all') params.set('range', 'month');

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
  }, [dateFrom, dateTo, quickSelect]);

  const filteredTransactions = useMemo(() => {
    let out = filterTransactions(transactions, searchQuery);
    if (statusFilter === 'paid' || statusFilter === 'pending' || statusFilter === 'partial') {
      out = out.filter((t) => t.paymentStatus === statusFilter);
    }
    if (nailTechFilter !== 'all') {
      out = out.filter((t) => t.nailTechId === nailTechFilter);
    }
    return [...out].sort((a, b) => (b.appointmentDate || '').localeCompare(a.appointmentDate || ''));
  }, [transactions, searchQuery, statusFilter, nailTechFilter]);

  const paginatedTransactions = useMemo(
    () => paginateTransactions(filteredTransactions, currentPage, PAGE_SIZE),
    [filteredTransactions, currentPage]
  );
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const totalItems = filteredTransactions.length;

  const monthOptions = useMemo(() => {
    const now = new Date();
    const options: { value: string; label: string }[] = [
      { value: 'custom', label: 'Custom Range' },
      ...Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return { value: `${y}-${m}`, label };
      }),
      { value: 'all', label: 'All Time' },
    ];
    return options;
  }, []);

  const handleQuickSelectChange = (value: string) => {
    setQuickSelect(value);
    if (value === 'custom') {
      return;
    }
    if (value === 'all') {
      setDateFrom('');
      setDateTo('');
      return;
    }
    const [y, m] = value.split('-').map(Number);
    const fromDate = new Date(y, m - 1, 1);
    const toDate = new Date(y, m, 0); // last day of selected month
    const pad = (n: number) => String(n).padStart(2, '0');
    setDateFrom(`${fromDate.getFullYear()}-${pad(fromDate.getMonth() + 1)}-${pad(fromDate.getDate())}`);
    setDateTo(`${toDate.getFullYear()}-${pad(toDate.getMonth() + 1)}-${pad(toDate.getDate())}`);
  };

  const handleDateFromChange = (v: string) => {
    setDateFrom(v);
    setQuickSelect('custom');
  };
  const handleDateToChange = (v: string) => {
    setDateTo(v);
    setQuickSelect('custom');
  };

  const exportButtonLabel = useMemo(() => {
    if (quickSelect === 'all') return 'Export All';
    if (quickSelect && quickSelect !== 'all' && quickSelect !== 'custom') {
      const [y, m] = quickSelect.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return `Export ${label}`;
    }
    return `Export CSV (${filteredTransactions.length})`;
  }, [quickSelect, filteredTransactions.length]);

  const chartData = useMemo(() => {
    const byDate = new Map<string, { date: string; total: number; paid: number; tip: number }>();
    for (const t of filteredTransactions) {
      const key = t.date ? (t.date.includes('T') ? t.date.slice(0, 10) : t.date) : '';
      if (!key) continue;
      const cur = byDate.get(key) || { date: key, total: 0, paid: 0, tip: 0 };
      byDate.set(key, {
        date: key,
        total: cur.total + t.total,
        paid: cur.paid + t.paid,
        tip: cur.tip + t.tip,
      });
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

  const totalTips = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.paymentStatus === 'paid')
      .reduce((sum, t) => sum + t.tip, 0);
  }, [filteredTransactions]);

  const adminCommission = useMemo(() => {
    const rate = adminCommissionRate / 100;
    return filteredTransactions
      .filter((t) => t.paymentStatus === 'paid')
      .reduce((sum, t) => sum + t.total * rate, 0);
  }, [filteredTransactions, adminCommissionRate]);

  const revenueByNailTech = useMemo(() => {
    const paidTx = filteredTransactions.filter((t) => t.paymentStatus === 'paid');
    const byTech = new Map<string, { name: string; total: number; count: number }>();
    for (const t of paidTx) {
      const techId = t.nailTechId || '_unknown';
      const tech = nailTechs.find((n) => n.id === t.nailTechId);
      const name = tech ? `Ms. ${tech.name}` : techId === '_unknown' ? 'Unassigned' : 'Unknown';
      const current = byTech.get(techId) || { name, total: 0, count: 0 };
      byTech.set(techId, {
        name,
        total: current.total + t.total,
        count: current.count + 1,
      });
    }
    return Array.from(byTech.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, nailTechs]);

  const exportToCsv = () => {
    const dateLabel = dateFrom || dateTo ? `${dateFrom || 'all'}-to-${dateTo || 'all'}` : 'all';
    const headers = [
      'Appt Date',
      'Time',
      'Social Media Name',
      'Service',
      'ST/HS',
      'Invoice',
      'Paid Amount',
      'Balance',
      'Tip',
      `Admin Com ${adminCommissionRate}%`,
    ];
    const byDateAsc = [...filteredTransactions].sort((a, b) => (a.appointmentDate || '').localeCompare(b.appointmentDate || ''));
    const rows = byDateAsc.map((t) => {
      const totalInvoice = t.total;
      const tipAmount = t.tip;
      const adminCom = t.total * (adminCommissionRate / 100);
      const apptDate = t.appointmentDate ? (t.appointmentDate.includes('T') ? t.appointmentDate.slice(0, 10) : t.appointmentDate) : '';
      const sortedTimes = Array.isArray(t.appointmentTimes) && t.appointmentTimes.length > 0
        ? [...t.appointmentTimes].sort((a, b) => {
            const toMins = (s: string) => {
              const match = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
              if (!match) return 0;
              let h = parseInt(match[1], 10);
              const m = parseInt(match[2], 10);
              const ampm = (match[3] || '').toUpperCase();
              if (ampm === 'PM' && h !== 12) h += 12;
              if (ampm === 'AM' && h === 12) h = 0;
              return h * 60 + m;
            };
            return toMins(a) - toMins(b);
          })
        : [];
      const timeStr = sortedTimes.length > 0
        ? sortedTimes.map(formatTime12Hour).join(', ')
        : (t.appointmentTime ? formatTime12Hour(t.appointmentTime) : '');
      const stHs = t.serviceLocation === 'home_service' ? 'HS' : t.serviceLocation === 'homebased_studio' ? 'ST' : '';
      return [
        apptDate,
        `"${(timeStr || '').replace(/"/g, '""')}"`,
        `"${(t.customerSocialMediaName || '').replace(/"/g, '""')}"`,
        `"${(t.service || '').replace(/"/g, '""')}"`,
        stHs,
        totalInvoice,
        t.paid,
        t.balance,
        tipAmount,
        adminCom,
      ];
    });
    const sumTotal = filteredTransactions.reduce((s, t) => s + t.total, 0);
    const sumPaid = filteredTransactions.reduce((s, t) => s + t.paid, 0);
    const sumTip = filteredTransactions.reduce((s, t) => s + t.tip, 0);
    const sumBalance = filteredTransactions.reduce((s, t) => s + t.balance, 0);
    const sumCommission = filteredTransactions
      .filter((t) => t.paymentStatus === 'paid')
      .reduce((s, t) => s + t.total * (adminCommissionRate / 100), 0);
    const totalRow = ['Total', '', '', '', '', sumTotal, sumPaid, sumBalance, sumTip, sumCommission];
    const csv = [headers.join(','), ...rows.map((r) => r.join(',')), totalRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-export-${dateLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    const dateLabel = dateFrom || dateTo ? `${dateFrom || 'all'} to ${dateTo || 'all'}` : 'All Time';
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const margin = 10;
    const headerY = 10;
    doc.setFontSize(14);
    doc.text('Finance Report', margin, headerY);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${dateLabel}`, margin, headerY + 5);
    doc.text(`Generated: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`, margin, headerY + 10);
    doc.setTextColor(0, 0, 0);

    const headers = [
      'Date',
      'Time',
      'Social Media Name',
      'Service',
      'ST/HS',
      'Invoice',
      'Paid Amount',
      'Balance',
      'Tip',
      `Commission (${adminCommissionRate}%)`,
    ];
    const fmt = (n: number) => `PHP ${String(Number(n).toLocaleString('en-US', { maximumFractionDigits: 0, minimumFractionDigits: 0 })).replace(/[^\d,.]/g, '')}`;
    const byDateAsc = [...filteredTransactions].sort((a, b) => (a.appointmentDate || '').localeCompare(b.appointmentDate || ''));
    const rows = byDateAsc.map((t) => {
      const totalInvoice = t.total;
      const tipAmount = t.tip;
      const commission = t.total * (adminCommissionRate / 100);
      const apptDate = t.appointmentDate ? (t.appointmentDate.includes('T') ? t.appointmentDate.slice(0, 10) : t.appointmentDate) : '—';
      const sortedTimes = Array.isArray(t.appointmentTimes) && t.appointmentTimes.length > 0
        ? [...t.appointmentTimes].sort((a, b) => {
            const toMins = (s: string) => {
              const match = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
              if (!match) return 0;
              let h = parseInt(match[1], 10);
              const m = parseInt(match[2], 10);
              const ampm = (match[3] || '').toUpperCase();
              if (ampm === 'PM' && h !== 12) h += 12;
              if (ampm === 'AM' && h === 12) h = 0;
              return h * 60 + m;
            };
            return toMins(a) - toMins(b);
          })
        : [];
      const timeStr = sortedTimes.length > 0
        ? sortedTimes.map(formatTime12Hour).join(', ')
        : (t.appointmentTime ? formatTime12Hour(t.appointmentTime) : '');
      const stHs = t.serviceLocation === 'home_service' ? 'HS' : t.serviceLocation === 'homebased_studio' ? 'ST' : '—';
      return [
        apptDate,
        timeStr || '—',
        t.customerSocialMediaName || '—',
        t.service || '—',
        stHs,
        fmt(totalInvoice),
        fmt(t.paid),
        fmt(t.balance),
        fmt(tipAmount),
        fmt(commission),
      ];
    });

    const sumTotal = filteredTransactions.reduce((s, t) => s + t.total, 0);
    const sumPaid = filteredTransactions.reduce((s, t) => s + t.paid, 0);
    const sumTip = filteredTransactions.reduce((s, t) => s + t.tip, 0);
    const sumCommission = filteredTransactions
      .filter((t) => t.paymentStatus === 'paid')
      .reduce((s, t) => s + t.total * (adminCommissionRate / 100), 0);
    const sumBalance = filteredTransactions.reduce((s, t) => s + t.balance, 0);
    const totalsRow = [
      'Total',
      '',
      '',
      '',
      '',
      fmt(sumTotal),
      fmt(sumPaid),
      fmt(sumBalance),
      fmt(sumTip),
      fmt(sumCommission),
    ];
    const bodyRows = rows.length > 0 ? [...rows, totalsRow] : rows;
    const totalsRowIndex = rows.length;

    const pageWidthMm = 297; // A4 landscape
    const tableWidth = pageWidthMm - 2 * margin;
    autoTable(doc, {
      head: [headers],
      footStyles: { fillColor: [255, 255, 255], fontStyle: 'bold', textColor: [0, 0, 0] },
      body: bodyRows,
      startY: 28,
      tableWidth,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, textColor: [0, 0, 0] },
      headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === totalsRowIndex) {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 28;

    const filename = `finance-report-${dateFrom || 'all'}-${dateTo || 'all'}.pdf`.replace(/\//g, '-');
    doc.save(filename);
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
    <div className="space-y-5 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard
          title="Today's Income"
          value={`₱${todayIncome.toLocaleString()}`}
          subtext="By appointment date (today)"
          icon="bi-cash-stack"
          variant="dark"
          className="flex-grow-1"
        />
        <StatCard
          title="This Week's Income"
          iconBgColor="#e9ecef"
          value={`₱${weekIncome.toLocaleString()}`}
          subtext="By appointment date (this week)"
          icon="bi-calendar-week"
          className="flex-grow-1"
        />
        <StatCard
          title="Pending Payments"
          iconBgColor="#e9ecef"
          value={`₱${pendingPayments.toLocaleString()}`}
          subtext="By appointment date (this week)"
          icon="bi-clock-history"
          className="flex-grow-1"
        />
        <StatCard
          title="Total Tips"
          iconBgColor="#e9ecef"
          value={`₱${totalTips.toLocaleString()}`}
          subtext="By appointment date (filtered range)"
          icon="bi-heart"
          className="flex-grow-1"
        />
        <StatCard
          title="Admin Commission"
          iconBgColor="#e9ecef"
          value={`₱${adminCommission.toLocaleString()}`}
          subtext={`${adminCommissionRate}% of invoice total, excluding tips (by appointment date)`}
          icon="bi-percent"
          className="flex-grow-1"
        />
      </div>

      {/* Revenue Trend Chart */}
      {chartData.length > 0 && (
        <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-3 md:p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData.map((d) => ({ ...d, dateLabel: d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '' }))} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#737373' }} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} tickFormatter={(v) => `₱${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as { date: string; total: number; paid: number; tip: number };
                    return (
                      <div className="rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 shadow-sm text-sm">
                        <p className="font-medium text-[#1a1a1a] mb-1">{p.date ? new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                        <p className="text-gray-600">Total: ₱{Number(p.total).toLocaleString()}</p>
                        <p className="text-gray-600">Paid: ₱{Number(p.paid).toLocaleString()}</p>
                        <p className="text-gray-600">Tip: ₱{Number(p.tip).toLocaleString()}</p>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="total" name="Total Invoice" stroke="#1a1a1a" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="paid" name="Paid Amount" stroke="#a3a3a3" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Revenue by Nail Tech */}
      {revenueByNailTech.length > 0 && (
        <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-3 md:p-4">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Revenue by Nail Tech</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {revenueByNailTech.map(({ id, name, total, count }) => (
                <div
                  key={id}
                  className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3 flex flex-col"
                >
                  <p className="font-medium text-[#1a1a1a] truncate">{name}</p>
                  <p className="text-lg font-semibold text-[#1a1a1a] mt-1">₱{total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{count} appointment{count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Card */}
      <Card className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 md:gap-3">
            <div className="relative flex-1 w-full sm:min-w-[180px] md:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by client or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 text-sm rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0 sm:min-w-[120px] md:min-w-[140px]">
              <label className="text-xs text-gray-400 whitespace-nowrap shrink-0">Quick Select</label>
              <Select value={quickSelect} onValueChange={handleQuickSelectChange}>
                <SelectTrigger className="flex-1 min-w-0 h-9 px-3">
                  <SelectValue placeholder="Custom Range" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 min-w-0 sm:min-w-[120px] md:min-w-[140px] h-9 px-3">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={nailTechFilter} onValueChange={setNailTechFilter}>
              <SelectTrigger className="flex-1 min-w-0 sm:min-w-[120px] w-auto max-w-[140px] h-9 px-3">
                <SelectValue placeholder="All Nail Techs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Nail Techs</SelectItem>
                {nailTechs.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 flex-1 min-w-0 sm:min-w-[120px] md:min-w-[140px]">
              <label className="text-xs text-gray-400 whitespace-nowrap shrink-0">Date range</label>
              <DateRangePicker
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={handleDateFromChange}
                onDateToChange={handleDateToChange}
                placeholder="From – To"
                className="flex-1 min-w-0"
              />
            </div>
            {(searchQuery || statusFilter !== 'all' || nailTechFilter !== 'all' || dateFrom || dateTo || quickSelect) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setNailTechFilter('all');
                  setDateFrom('');
                  setDateTo('');
                  setQuickSelect('custom');
                }}
                className="h-9 px-3 text-sm rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all flex items-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            <button
              onClick={exportToPdf}
              disabled={filteredTransactions.length === 0}
              className="h-9 px-4 text-sm font-medium rounded-lg border border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={exportToCsv}
              disabled={filteredTransactions.length === 0}
              className="h-9 px-4 text-sm font-medium rounded-lg border border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa] transition-all flex items-center gap-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {exportButtonLabel}
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
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Time</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Social Media Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Service</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Invoice</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Paid Amount</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Balance</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Tip</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Commission</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {loading ? (
                  <>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 w-20 animate-pulse rounded bg-[#e5e5e5]" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <div className="h-12 w-12 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                          <Search className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                          {searchQuery || statusFilter !== 'all' || nailTechFilter !== 'all' || dateFrom || dateTo || quickSelect !== 'custom'
                            ? 'No transactions match your current filters.'
                            : 'No transactions in this range.'}
                        </p>
                        <p className="text-xs text-gray-400 max-w-[240px]">
                          {searchQuery || statusFilter !== 'all' || nailTechFilter !== 'all' || dateFrom || dateTo || quickSelect !== 'custom'
                            ? 'Try adjusting the date range or clearing the search.'
                            : 'Adjust your date range or add completed bookings.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((item) => {
                    const commission = item.total * (adminCommissionRate / 100);
                    return (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors duration-100">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatSlotTimes(item.appointmentTimes, item.appointmentTime)}
                      </td>
                      <td className="px-4 py-3 text-[#1a1a1a]">{item.customerSocialMediaName || '—'}</td>
                      <td className="px-4 py-3 text-[#1a1a1a]">
                        <span className="inline-flex items-center gap-1.5">
                          {item.service}
                          {serviceLocationBadge(item.serviceLocation)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1a1a1a] tabular-nums">₱{item.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums">₱{item.paid.toLocaleString()}</td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className={item.balance > 0 ? 'text-amber-600 font-medium' : 'text-gray-500'}>
                          ₱{item.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums">₱{item.tip.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums">₱{commission.toLocaleString()}</td>
                      <td className="px-4 py-3">{getPaymentStatusBadge(item.paymentStatus)}</td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden p-4 space-y-3">
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm space-y-3">
                    <div className="flex justify-between">
                      <div className="h-5 w-32 animate-pulse rounded bg-[#e5e5e5]" />
                      <div className="h-6 w-16 animate-pulse rounded-full bg-[#e5e5e5]" />
                    </div>
                    <div className="h-4 w-24 animate-pulse rounded bg-[#e5e5e5]" />
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="space-y-1">
                          <div className="h-3 w-12 animate-pulse rounded bg-[#e5e5e5]" />
                          <div className="h-4 w-20 animate-pulse rounded bg-[#e5e5e5]" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : paginatedTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                  <Search className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {searchQuery || statusFilter !== 'all' || nailTechFilter !== 'all' || dateFrom || dateTo || quickSelect !== 'custom'
                    ? 'No transactions match your current filters.'
                    : 'No transactions in this range.'}
                </p>
                <p className="text-xs text-gray-400 max-w-[240px]">
                  {searchQuery || statusFilter !== 'all' || nailTechFilter !== 'all' || dateFrom || dateTo || quickSelect !== 'custom'
                    ? 'Try adjusting the date range or clearing the search.'
                    : 'Adjust your date range or add completed bookings.'}
                </p>
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
                    {item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    {(() => {
                      const t = formatSlotTimes(item.appointmentTimes, item.appointmentTime);
                      return t && t !== '—' ? <> · <span className="whitespace-nowrap">{t}</span></> : '';
                    })()}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Social Media Name</span>
                      <p className="text-[#1a1a1a]">{item.customerSocialMediaName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Service</span>
                      <p className="text-[#1a1a1a] flex items-center gap-1.5">
                        {item.service}
                        {serviceLocationBadge(item.serviceLocation)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Invoice</span>
                      <p className="text-[#1a1a1a] font-medium">₱{item.total.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Paid Amount</span>
                      <p className="text-[#1a1a1a]">₱{item.paid.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Balance</span>
                      <p className={item.balance > 0 ? 'text-amber-600 font-medium' : 'text-[#1a1a1a]'}>
                        ₱{item.balance.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Tip</span>
                      <p className="text-[#1a1a1a]">₱{item.tip.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Commission</span>
                      <p className="text-[#1a1a1a]">₱{(item.total * (adminCommissionRate / 100)).toLocaleString()}</p>
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
                {(() => {
                  const maxVisible = 7;
                  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let end = Math.min(totalPages, start + maxVisible - 1);
                  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
                  return Array.from({ length: end - start + 1 }, (_, i) => {
                    const page = start + i;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`h-9 w-9 flex items-center justify-center rounded-lg border text-xs font-medium transition-all ${currentPage === page ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-sm' : 'border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'}`}
                      >{page}</button>
                    );
                  });
                })()}
              </div>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-9 min-w-[44px] flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-400 hover:border-[#1a1a1a] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm px-2"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getEffectiveTotal(booking: any): number {
  const inv = booking?.invoice;
  const hasInvoice = Boolean(inv && (inv.quotationId || inv.total != null));
  const fromInvoice = inv?.total ?? inv?.totalAmount;
  const fromPricing = booking?.pricing?.total ?? 0;
  // Prefer invoice.total when present and > 0; otherwise use pricing.total
  return hasInvoice && typeof fromInvoice === 'number' && fromInvoice > 0 ? fromInvoice : fromPricing;
}

function mapBookingToTransaction(booking: any): Transaction {
  const invoiceTotal = getEffectiveTotal(booking);
  const paidAmount =
    booking?.pricing?.paidAmount ??
    (booking as any)?.paidAmount ??
    (booking as any)?.totalPaid ??
    0;
  const tipAmount = booking.pricing?.tipAmount ?? 0;
  // Do NOT use paid amount as invoice when no invoice exists — invoice total comes only from actual invoice or pricing
  const balance = Math.max(0, invoiceTotal - paidAmount);
  // Only treat as "paid" when we have a real invoice (quotation or total > 0); no invoice yet → partial at best
  const inv = booking?.invoice;
  const hasRealInvoice = Boolean(
    inv && (inv.quotationId || (typeof inv.total === 'number' && inv.total > 0))
  );
  const paymentStatus =
    hasRealInvoice && balance <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
  const apptDate = booking.appointmentDate || '';
  const apptTime = booking.appointmentTime || '';
  const apptTimes = Array.isArray(booking.appointmentTimes) ? booking.appointmentTimes : (apptTime ? [apptTime] : []);
  return {
    id: booking.id,
    date: apptDate || booking.completedAt || booking.createdAt || '',
    appointmentDate: apptDate,
    appointmentTime: apptTime,
    appointmentTimes: apptTimes,
    clientName: booking.customerName || 'Unknown Client',
    customerSocialMediaName: booking.customerSocialMediaName || '',
    service: booking.service?.type || 'Nail Service',
    serviceLocation: booking.service?.location,
    total: invoiceTotal,
    paid: paidAmount,
    tip: tipAmount,
    discount: booking.pricing?.discountAmount ?? 0,
    balance,
    paymentStatus,
    nailTechId: booking.nailTechId,
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


