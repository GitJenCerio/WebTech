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
    <div className="container-mobile">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-dark">
          Overview
        </h1>
        <p className="text-sm text-gray-medium mt-1">
          Dashboard summary and today's activities
        </p>
      </div>

      {/* Stat Cards - Mobile-first responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
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

      {/* Charts Row - Mobile stacks, desktop side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
        {/* Weekly Appointments Chart - Takes 2/3 on desktop */}
        <div className="lg:col-span-2">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <h5 className="text-lg font-semibold text-[#212529]">
                Weekly Appointments
              </h5>
            </CardHeader>
            <CardContent>
              <ChartPlaceholder type="bar" title="Weekly appointments chart" />
            </CardContent>
          </Card>
        </div>
        
        {/* Slot Utilization - Takes 1/3 on desktop */}
        <div className="lg:col-span-1">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <h5 className="text-lg font-semibold text-[#212529]">
                Slot Utilization Today
              </h5>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#212529] rounded-sm"></div>
                  <span className="text-[#212529]">Booked: 5</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
                  <span className="text-[#212529]">Available: 3</span>
                </div>
              </div>
              <ChartPlaceholder type="pie" height="200px" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Today's Appointments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h5 className="text-lg font-semibold text-[#212529]">
              Today&apos;s Appointments
            </h5>
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
