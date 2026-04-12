'use client';

import { useState, useEffect, useMemo } from 'react';
import StatCard from '@/components/admin/StatCard';
import { StatCardSkeleton } from '@/components/admin/StatCardSkeleton';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import StatusBadge from '@/components/admin/StatusBadge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { BookingStatus } from '@/components/admin/StatusBadge';
import { useNailTechs } from '@/lib/hooks/useNailTechs';
import { getSlotServiceDisplay } from '@/lib/serviceLabels';
import { getCombinedInvoiceTotal, hasAnyRealInvoice } from '@/lib/utils/bookingInvoice';

interface TodayBooking {
  id: string;
  time: string;
  timeSort: string;
  clientName: string;
  service: string;
  nailTechId?: string;
  status: BookingStatus;
  /** Invoice total when an admin invoice exists */
  amount: number;
}

function getManilaDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).replace(/-/g, '');
}

function formatTime(isoOrTime: string): string {
  if (!isoOrTime) return '—';
  const s = String(isoOrTime).trim();
  let hour24 = 0;
  let mins = '00';
  if (s.toUpperCase().includes('AM') || s.toUpperCase().includes('PM')) {
    const match = s.match(/(\d+):?(\d*)\s*(AM|PM)/i);
    if (match) {
      let [, h, m, period] = match;
      let hour = parseInt(h || '0', 10);
      const min = parseInt((m || '0').replace(/\D/g, '').slice(0, 2) || '0', 10);
      if (period?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      else if (period?.toUpperCase() === 'AM' && hour === 12) hour = 0;
      hour24 = hour;
      mins = String(min).padStart(2, '0');
    }
  } else if (s.includes(':')) {
    const [h, m] = s.split(':');
    hour24 = parseInt(h || '0', 10);
    mins = ((m || '00').replace(/\D/g, '').padStart(2, '0').slice(0, 2) || '00');
  } else {
    const d = new Date(isoOrTime);
    if (!isNaN(d.getTime())) {
      hour24 = d.getHours();
      mins = String(d.getMinutes()).padStart(2, '0');
    } else {
      return isoOrTime;
    }
  }
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${mins} ${ampm}`;
}

const PIE_COLORS = ['#1a1a1a', '#e5e5e5', '#a3a3a3'];

/**
 * Admin Overview/Dashboard Page
 * Fetches live data from API, displays charts with recharts
 */
export default function OverviewPage() {
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [weekBookings, setWeekBookings] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { nailTechs } = useNailTechs();

  const todayKey = getManilaDateKey();
  const todayYmd = `${todayKey.slice(0, 4)}-${todayKey.slice(4, 6)}-${todayKey.slice(6, 8)}`;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [todayRes, weekRes, slotsRes] = await Promise.all([
          fetch('/api/bookings?range=today'),
          fetch('/api/bookings?range=week'),
          fetch(`/api/slots?startDate=${todayYmd}&endDate=${todayYmd}`),
        ]);

        if (!todayRes.ok || !weekRes.ok) throw new Error('Failed to fetch bookings');
        const todayData = await todayRes.json();
        const weekData = await weekRes.json();
        const slotsData = slotsRes.ok ? await slotsRes.json() : { slots: [] };

        const today = (todayData.bookings || []).map((b: any) => {
          const rawTime = (b.appointmentTimes?.[0] || b.appointmentTime || '').toString();
          return {
            id: b.id,
            time: formatTime(rawTime || b.createdAt || ''),
            timeSort: rawTime || '99:99',
            clientName: b.customerName || 'Unknown Client',
            service: b.service?.type || 'Nail Service',
            nailTechId: b.nailTechId,
            status: (b.status || 'pending') as BookingStatus,
            amount: hasAnyRealInvoice(b) ? getCombinedInvoiceTotal(b) : 0,
            pricing: b.pricing,
          };
        });
        today.sort((a: { timeSort: string }, b: { timeSort: string }) => a.timeSort.localeCompare(b.timeSort, undefined, { numeric: true }));
        setTodayBookings(today);

        setWeekBookings(weekData.bookings || []);

        const slotList = slotsData.slots || [];
        setSlots(slotList);
      } catch (err: any) {
        setError(err.message || 'Failed to load overview data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [todayYmd]);

  const stats = useMemo(() => {
    const upcoming = todayBookings.filter((b) =>
      ['pending', 'confirmed', 'booked'].includes(String(b.status).toLowerCase())
    );
    const completed = todayBookings.filter((b) =>
      String(b.status).toLowerCase() === 'completed'
    );
    const availableSlots = slots.filter((s: any) => s.status === 'available');
    const bookedSlots = slots.filter((s: any) =>
      ['pending', 'confirmed'].includes(s.status)
    );
    const totalSlots = slots.length;
    const income = todayBookings.reduce((sum, b) => {
      const s = String(b.status).toLowerCase();
      if (['completed', 'confirmed', 'pending', 'booked'].includes(s)) {
        return sum + Number(b.amount) || 0;
      }
      return sum;
    }, 0);
    return {
      appointmentsCount: todayBookings.length,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      availableSlots: availableSlots.length,
      totalSlots: totalSlots || 1,
      bookedSlots: bookedSlots.length,
      income,
    };
  }, [todayBookings, slots]);

  const weeklyChartData = useMemo(() => {
    const dayCount: Record<string, number> = {};
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach((d) => (dayCount[d] = 0));
    weekBookings.forEach((b: any) => {
      const dateStr = b.appointmentDate || b.completedAt || b.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      if (dayCount[dayName] !== undefined) dayCount[dayName]++;
    });
    return days.map((name) => ({ name, count: dayCount[name] ?? 0 }));
  }, [weekBookings]);

  const pieData = useMemo(() => {
    const booked = stats.bookedSlots;
    const available = stats.availableSlots;
    return [
      { name: 'Booked', value: booked, color: PIE_COLORS[0] },
      { name: 'Available', value: available, color: PIE_COLORS[1] },
    ].filter((d) => d.value > 0);
  }, [stats.bookedSlots, stats.availableSlots]);

  const columns = [
    { key: 'time' as const, header: 'Time' },
    { key: 'clientName' as const, header: 'Client' },
    { key: 'service' as const, header: 'Service' },
    {
      key: 'nailTech' as const,
      header: 'Nail Tech',
      render: (item: TodayBooking) => (item.nailTechId ? nailTechs.find((t) => t.id === item.nailTechId)?.name ?? '—' : '—'),
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (item: TodayBooking) => <StatusBadge status={item.status} />,
    },
  ];

  if (loading && todayBookings.length === 0) {
    return (
      <div className="w-full max-w-full space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="border border-[#e5e5e5] rounded-xl overflow-hidden h-[360px] flex flex-col">
              <div className="p-4 border-b border-[#f0f0f0]">
                <div className="h-5 w-40 bg-[#e5e5e5] animate-pulse rounded" />
              </div>
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="h-[280px] w-full max-w-md bg-[#e5e5e5] animate-pulse rounded" />
              </div>
            </div>
          </div>
          <div>
            <div className="border border-[#e5e5e5] rounded-xl overflow-hidden h-[360px] flex flex-col">
              <div className="p-4 border-b border-[#f0f0f0]">
                <div className="h-5 w-32 bg-[#e5e5e5] animate-pulse rounded" />
              </div>
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="h-[200px] w-[200px] rounded-full bg-[#e5e5e5] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="border border-[#e5e5e5] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#f0f0f0]">
            <div className="h-5 w-44 bg-[#e5e5e5] animate-pulse rounded" />
          </div>
          <TableSkeleton rows={5} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-3 md:space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-6 lg:mb-8 items-stretch">
        <StatCard
          title="Today's Appointments"
          value={stats.appointmentsCount}
          subtext={`${stats.upcomingCount} upcoming`}
          icon="bi-calendar-check"
          variant="light"
        />
        <StatCard
          title="Available Slots Today"
          value={stats.availableSlots}
          subtext={`Out of ${stats.totalSlots} total slots`}
          icon="bi-clock"
          variant="light"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedCount}
          subtext=""
          icon="bi-check-circle"
          variant="dark"
        />
        <StatCard
          title="Estimated Income Today"
          value={`₱${stats.income.toLocaleString()}`}
          subtext="From completed & booked"
          icon="bi-cash-stack"
          variant="light"
        />
      </div>

      <Card className="border border-[#e5e5e5] shadow-card bg-white overflow-hidden transition-shadow hover:shadow-hover">
        <CardHeader className="flex-shrink-0 pb-2 border-b border-[#f0f0f0]">
          <h5 className="text-lg font-semibold text-[#1a1a1a]">Weekly Appointments</h5>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col" style={{ minHeight: 280 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#888" />
              <YAxis tick={{ fontSize: 12 }} stroke="#888" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5' }}
                formatter={(value: number) => [value, 'Appointments']}
              />
              <Bar dataKey="count" fill="#1a1a1a" radius={[4, 4, 0, 0]} name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-[#e5e5e5] shadow-card bg-white">
        <CardHeader className="border-b border-[#f0f0f0]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h5 className="text-lg font-semibold text-[#1a1a1a]">Today&apos;s Appointments</h5>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/bookings">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0f0f0]" style={{ background: 'linear-gradient(to right, #fafafa, #f5f5f5)' }}>
                  {columns.map((col) => (
                    <th key={col.key} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {todayBookings.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-400 text-sm">No appointments today</td>
                  </tr>
                ) : (
                  todayBookings.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                      {columns.map((col) => (
                        <td key={col.key} className="px-5 py-3.5">
                          {col.render ? col.render(item) : (item as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden p-4 space-y-3">
            {todayBookings.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No appointments today</p>
            ) : (
              todayBookings.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-[#1a1a1a]">{item.clientName}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-gray-500">{item.time}</p>
                  <p className="text-sm text-[#1a1a1a]">{getSlotServiceDisplay(item.service)}</p>
                  {item.nailTechId && (
                    <p className="text-xs text-gray-500">
                      {nailTechs.find((t) => t.id === item.nailTechId)?.name ?? '—'}
                    </p>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link href="/admin/bookings">View Details</Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
