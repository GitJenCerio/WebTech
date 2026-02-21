'use client';

import { useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import ChartPlaceholder from '@/components/admin/ChartPlaceholder';
import StatusBadge from '@/components/admin/StatusBadge';
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface TodayBooking {
  id: string;
  time: string;
  clientName: string;
  service: string;
  status: 'booked' | 'completed' | 'cancelled';
}

/**
 * Admin Overview/Dashboard Page
 * Mobile-first responsive design with monochrome luxury branding
 * Displays key metrics, charts, and today's appointments
 */
export default function OverviewPage() {
  // Mock data - will be replaced with real API data
  const todayBookings: TodayBooking[] = [
    {
      id: '1',
      time: '9:00 AM',
      clientName: 'Sarah Johnson',
      service: 'Russian Manicure',
      status: 'booked',
    },
    {
      id: '2',
      time: '11:00 AM',
      clientName: 'Maria Garcia',
      service: 'Nail Art + Pedicure',
      status: 'booked',
    },
    {
      id: '3',
      time: '2:00 PM',
      clientName: 'Emily Chen',
      service: 'Gel Extension',
      status: 'booked',
    },
    {
      id: '4',
      time: '4:00 PM',
      clientName: 'Jessica Williams',
      service: 'Manicure & Pedicure',
      status: 'booked',
    },
    {
      id: '5',
      time: '5:30 PM',
      clientName: 'Amanda Lee',
      service: 'Nail Art',
      status: 'booked',
    },
  ];

  const columns = [
    {
      key: 'time',
      header: 'Time',
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
      key: 'status',
      header: 'Status',
      render: (item: TodayBooking) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-[#1a1a1a]">Overview</h1>

      {/* Stat Cards - Mobile-first responsive grid, equal height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8 items-stretch">
        <StatCard
          title="Today's Appointments"
          value={todayBookings.length}
          subtext={`${todayBookings.filter((b) => b.status === 'booked').length} upcoming`}
          icon="bi-calendar-check"
          variant="light"
        />
        <StatCard
          title="Available Slots Today"
          value="3"
          subtext="Out of 8 total slots"
          icon="bi-clock"
          variant="light"
        />
        <StatCard
          title="Completed Today"
          value="2"
          subtext="This morning"
          icon="bi-check-circle"
          variant="dark"
        />
        <StatCard
          title="Estimated Income Today"
          value="â‚±12,500"
          subtext="From completed & booked"
          icon="bi-cash-stack"
          variant="light"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch lg:min-h-[380px]">
        {/* Weekly Appointments Chart - Takes 2/3 on desktop */}
        <div className="lg:col-span-2 min-h-0 flex flex-col">
          <Card className="h-full flex flex-col border border-[#e5e5e5] shadow-card bg-white overflow-hidden transition-shadow hover:shadow-hover">
            <CardHeader className="flex-shrink-0 pb-2 border-b border-[#f0f0f0]">
              <h5 className="text-lg font-semibold text-[#1a1a1a]">Weekly Appointments</h5>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col">
              <ChartPlaceholder type="bar" title="Weekly appointments chart" height="280px" className="flex-1" />
            </CardContent>
          </Card>
        </div>
        
        {/* Slot Utilization - Takes 1/3 on desktop */}
        <div className="lg:col-span-1 min-h-0 flex flex-col">
          <Card className="h-full flex flex-col border border-[#e5e5e5] shadow-card bg-white overflow-hidden transition-shadow hover:shadow-hover">
            <CardHeader className="flex-shrink-0 pb-2 border-b border-[#f0f0f0]">
              <h5 className="text-lg font-semibold text-[#1a1a1a]">Slot Utilization Today</h5>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col">
              <div className="flex justify-between items-center mb-4 text-sm flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#1a1a1a] rounded-sm"></div>
                  <span className="text-[#1a1a1a]">Booked: 5</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#e5e5e5] rounded-sm"></div>
                  <span className="text-[#1a1a1a]">Available: 3</span>
                </div>
              </div>
              <ChartPlaceholder type="pie" height="200px" className="flex-1 min-h-[200px]" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Today's Appointments Table */}
      <Card className="border border-[#e5e5e5] shadow-card bg-white">
        <CardHeader className="border-b border-[#f0f0f0]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h5 className="text-lg font-semibold text-[#1a1a1a]">Today&apos;s Appointments</h5>
            <Button 
              asChild
              variant="outline"
              size="sm"
            >
              <Link href="/admin/bookings">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={todayBookings.slice(0, 5)}
            keyExtractor={(item) => item.id}
            emptyMessage="No appointments today"
          />
        </CardContent>
      </Card>
    </div>
  );
}
