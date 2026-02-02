'use client';

import { useState, useEffect } from 'react';
import CalendarPanel from '@/components/admin/bookings/CalendarPanel';
import SlotList from '@/components/admin/bookings/SlotList';
import BookingDetailsModal from '@/components/admin/bookings/BookingDetailsModal';
import AddSlotModal from '@/components/admin/bookings/AddSlotModal';
import NailTechFilter from '@/components/admin/bookings/NailTechFilter';
import NailTechBadge from '@/components/admin/NailTechBadge';
import DataTable from '@/components/admin/DataTable';
import FilterBar from '@/components/admin/FilterBar';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import ActionDropdown from '@/components/admin/ActionDropdown';
import { BookingStatus } from '@/components/admin/StatusBadge';
import { useUserRole } from '@/lib/hooks/useUserRole';

interface Slot {
  id: string;
  time: string;
  status: BookingStatus;
  type?: 'regular' | 'with_squeeze_fee';
  nailTechId?: string;
  nailTechName?: string;
  clientName?: string;
  service?: string;
}

interface Booking {
  id: string;
  date: string;
  time: string;
  clientName: string;
  service: string;
  status: BookingStatus;
  amount?: number;
}

export default function BookingsPage() {
  const userRole = useUserRole();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedNailTechId, setSelectedNailTechId] = useState<string>(
    userRole.assignedNailTechId || 'all'
  );
  const [selectedBooking, setSelectedBooking] = useState<{
    date: string;
    time: string;
    clientName: string;
    service: string;
    status: BookingStatus;
    notes?: string;
    paymentStatus?: string;
    amount?: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock nail techs data
  const nailTechs = [
    { id: '1', name: 'Jhen', role: 'Owner' },
    { id: '2', name: 'Maria Santos', role: 'Senior Tech' },
    { id: '3', name: 'Anna Cruz', role: 'Junior Tech' },
  ];

  // Mock slots for selected date
  const generateSlots = (date: Date, filterTechId?: string): Slot[] => {
    const slots: Slot[] = [];
    const times = [
      '9:00 AM',
      '10:00 AM',
      '11:00 AM',
      '12:00 PM',
      '1:00 PM',
      '2:00 PM',
      '3:00 PM',
      '4:00 PM',
      '5:00 PM',
      '6:00 PM',
    ];

    // Assign slots to different techs
    const techIds = ['1', '2', '3'];
    
    times.forEach((time, index) => {
      const techId = techIds[index % techIds.length];
      const tech = nailTechs.find((t) => t.id === techId);
      
      if (index % 3 === 0) {
        slots.push({
          id: `${date.getTime()}-${index}`,
          time,
          status: 'booked',
          nailTechId: techId,
          nailTechName: tech?.name,
          clientName: `Client ${index + 1}`,
          service: 'Russian Manicure',
        });
      } else if (index % 4 === 0) {
        slots.push({
          id: `${date.getTime()}-${index}`,
          time,
          status: 'disabled',
          nailTechId: techId,
          nailTechName: tech?.name,
        });
      } else {
        slots.push({
          id: `${date.getTime()}-${index}`,
          time,
          status: 'available',
          nailTechId: techId,
          nailTechName: tech?.name,
        });
      }
    });

    // Filter by selected nail tech if not "all"
    if (filterTechId && filterTechId !== 'all') {
      return slots.filter((slot) => slot.nailTechId === filterTechId);
    }

    return slots;
  };

  const [slots, setSlots] = useState<Slot[]>(() => {
    const techId = userRole.assignedNailTechId || selectedNailTechId;
    return generateSlots(selectedDate, techId);
  });

  // Update slots when date or tech filter changes
  useEffect(() => {
    const techId = userRole.assignedNailTechId || selectedNailTechId;
    setSlots(generateSlots(selectedDate, techId));
  }, [selectedDate, selectedNailTechId, userRole.assignedNailTechId]);

  const handleAddSlot = (slotsData: Array<{
    date: string;
    time: string;
    status: BookingStatus;
    type: 'regular' | 'with_squeeze_fee';
    nailTechId: string;
    notes?: string;
  }>) => {
    // Filter slots for the selected date only
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const relevantSlots = slotsData.filter((slot) => slot.date === selectedDateStr);

    const newSlots: Slot[] = relevantSlots.map((slotData) => {
      const tech = nailTechs.find((t) => t.id === slotData.nailTechId);
      return {
        id: `${Date.now()}-${Math.random()}-${slotData.time}`,
        time: slotData.time,
        status: slotData.status,
        type: slotData.type,
        nailTechId: slotData.nailTechId,
        nailTechName: tech?.name,
        clientName: undefined,
        service: undefined,
      };
    });

    // Merge with existing slots and sort by time
    const allSlots = [...slots, ...newSlots].sort((a, b) => {
      const timeA = new Date(`2000-01-01 ${a.time}`);
      const timeB = new Date(`2000-01-01 ${b.time}`);
      return timeA.getTime() - timeB.getTime();
    });

    setSlots(allSlots);
  };

  // Mock bookings for table
  const bookings: Booking[] = [
    {
      id: '1',
      date: '2024-01-15',
      time: '9:00 AM',
      clientName: 'Sarah Johnson',
      service: 'Russian Manicure',
      status: 'booked',
      amount: 2500,
    },
    {
      id: '2',
      date: '2024-01-15',
      time: '11:00 AM',
      clientName: 'Maria Garcia',
      service: 'Nail Art + Pedicure',
      status: 'booked',
      amount: 3500,
    },
    {
      id: '3',
      date: '2024-01-14',
      time: '2:00 PM',
      clientName: 'Emily Chen',
      service: 'Gel Extension',
      status: 'completed',
      amount: 4500,
    },
  ];

  const handleSlotClick = (slot: Slot) => {
    if (slot.status === 'booked' && slot.clientName) {
      setSelectedBooking({
        date: selectedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: slot.time,
        clientName: slot.clientName,
        service: slot.service || 'Nail Service',
        status: slot.status,
        notes: 'Client prefers short nails. Favorite color: nude pink.',
        paymentStatus: 'Paid',
        amount: 2500,
      });
      setShowModal(true);
    }
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (item: Booking) => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      },
    },
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
                  date: item.date,
                  time: item.time,
                  clientName: item.clientName,
                  service: item.service,
                  status: item.status,
                  amount: item.amount,
                });
                setShowModal(true);
              },
            },
            { label: 'Edit', icon: 'bi-pencil' },
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
          Bookings & Slots
        </h4>
        <div className="d-flex gap-2 flex-wrap">
          {userRole.canManageAllTechs && (
            <NailTechFilter
              nailTechs={nailTechs}
              selectedTechId={selectedNailTechId}
              onTechChange={setSelectedNailTechId}
              className="d-none d-md-block"
            />
          )}
          <button
            className="btn btn-dark"
            onClick={() => setShowAddSlotModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>Add Slot
          </button>
        </div>
      </div>

      {/* Mobile Nail Tech Filter */}
      {userRole.canManageAllTechs && (
        <div className="mb-3 d-md-none">
          <NailTechFilter
            nailTechs={nailTechs}
            selectedTechId={selectedNailTechId}
            onTechChange={setSelectedNailTechId}
          />
        </div>
      )}

      {/* Calendar Panel */}
      <div className="row">
        <div className="col-12 col-lg-4">
          <CalendarPanel
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Slot List */}
        <div className="col-12 col-lg-8">
          <SlotList
            date={selectedDate}
            slots={slots.map((slot) => ({
              ...slot,
              nailTechRole: nailTechs.find((t) => t.id === slot.nailTechId)?.role,
            }))}
            onSlotClick={handleSlotClick}
            onView={(slot) => handleSlotClick(slot)}
            onEdit={(slot) => console.log('Edit', slot)}
            onCancel={(slot) => console.log('Cancel', slot)}
          />
        </div>
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
                { value: 'booked', label: 'Booked' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ],
            },
            {
              key: 'dateFrom',
              label: 'Date From',
              type: 'date',
              value: '',
            },
            {
              key: 'dateTo',
              label: 'Date To',
              type: 'date',
              value: '',
            },
          ]}
        />

        <DataTable
          title="All Bookings"
          columns={columns}
          data={bookings}
          keyExtractor={(item) => item.id}
          emptyMessage="No bookings found"
        />

        <div className="mt-3">
          <Pagination
            currentPage={currentPage}
            totalPages={5}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onMarkComplete={() => {
          console.log('Mark complete');
          setShowModal(false);
        }}
        onCancel={() => {
          console.log('Cancel booking');
          setShowModal(false);
        }}
        onReschedule={() => {
          console.log('Reschedule');
        }}
      />

      {/* Add Slot Modal */}
      <AddSlotModal
        show={showAddSlotModal}
        onHide={() => setShowAddSlotModal(false)}
        onAdd={handleAddSlot}
        selectedDate={selectedDate}
        nailTechs={userRole.canManageAllTechs ? nailTechs : nailTechs.filter((t) => t.id === userRole.assignedNailTechId)}
        defaultNailTechId={userRole.assignedNailTechId}
      />
    </div>
  );
}
