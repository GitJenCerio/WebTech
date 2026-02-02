'use client';

import { useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import ChartPlaceholder from '@/components/admin/ChartPlaceholder';
import StatusBadge from '@/components/admin/StatusBadge';
import Link from 'next/link';

interface TodayBooking {
  id: string;
  time: string;
  clientName: string;
  service: string;
  status: 'booked' | 'completed' | 'cancelled';
}

export default function OverviewPage() {
  // Mock data
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
    <div>
      <h4 className="mb-4" style={{ fontWeight: 600, color: '#212529' }}>
        Overview
      </h4>

      {/* Stat Cards */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Today's Appointments"
            value={todayBookings.length}
            subtext={`${todayBookings.filter((b) => b.status === 'booked').length} upcoming`}
            icon="bi-calendar-check"
            iconBgColor="#e9ecef"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Available Slots Today"
            value="3"
            subtext="Out of 8 total slots"
            icon="bi-clock"
            iconBgColor="#e9ecef"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Completed Today"
            value="2"
            subtext="This morning"
            icon="bi-check-circle"
            iconBgColor="#212529"
            darkBackground={true}
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Estimated Income Today"
            value="₱12,500"
            subtext="From completed & booked"
            icon="bi-cash-stack"
            iconBgColor="#e9ecef"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card" style={{ borderRadius: '12px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)' }}>
            <div
              className="card-header"
              style={{
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e0e0e0',
                padding: '1.25rem 1.5rem',
              }}
            >
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                Weekly Appointments
              </h5>
            </div>
            <div className="card-body">
              <ChartPlaceholder type="bar" title="Weekly appointments chart" />
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card" style={{ borderRadius: '12px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)' }}>
            <div
              className="card-header"
              style={{
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e0e0e0',
                padding: '1.25rem 1.5rem',
              }}
            >
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                Slot Utilization Today
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#212529',
                      borderRadius: '2px',
                    }}
                  ></div>
                  <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                    Booked: 5
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '2px',
                    }}
                  ></div>
                  <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                    Available: 3
                  </span>
                </div>
              </div>
              <ChartPlaceholder type="pie" height="200px" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments Table */}
      <div className="card data-table-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Today&apos;s Appointments</h5>
          <Link href="/admin/bookings" className="btn btn-sm btn-outline-secondary">
            View All
          </Link>
        </div>
        <DataTable
          columns={columns}
          data={todayBookings.slice(0, 5)}
          keyExtractor={(item) => item.id}
          emptyMessage="No appointments today"
        />
      </div>
    </div>
  );
}
