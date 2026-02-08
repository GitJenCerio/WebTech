'use client';

import { useState, useEffect } from 'react';
import CalendarPanel from '@/components/admin/bookings/CalendarPanel';
import SlotList from '@/components/admin/bookings/SlotList';
import BookingDetailsModal from '@/components/admin/bookings/BookingDetailsModal';
import AddSlotModal from '@/components/admin/bookings/AddSlotModal';
import EditSlotModal from '@/components/admin/bookings/EditSlotModal';
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal';
import NailTechFilter from '@/components/admin/bookings/NailTechFilter';
import NailTechBadge from '@/components/admin/NailTechBadge';
import DataTable from '@/components/admin/DataTable';
import FilterBar from '@/components/admin/FilterBar';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import ActionDropdown from '@/components/admin/ActionDropdown';
import { BookingStatus } from '@/components/admin/StatusBadge';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { format } from 'date-fns';

interface Slot {
  id: string;
  date?: string;
  time: string;
  status: BookingStatus;
  type?: 'regular' | 'with_squeeze_fee';
  nailTechId?: string;
  nailTechName?: string;
  clientName?: string;
  service?: string;
  isHidden?: boolean;
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

  // State for nail techs
  const [nailTechs, setNailTechs] = useState<Array<{ id: string; name: string; role?: string }>>([]);
  const [nailTechsLoading, setNailTechsLoading] = useState(true);

  // State for slots
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // State for monthly slots (for calendar display)
  const [monthlySlots, setMonthlySlots] = useState<Slot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State for add slot operation
  const [addingSlots, setAddingSlots] = useState(false);
  const [addSlotsError, setAddSlotsError] = useState<string | null>(null);

  // State for editing slots
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [editingSlot, setEditingSlot] = useState(false);
  const [editSlotError, setEditSlotError] = useState<string | null>(null);

  // State for delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);
  const [isDeletingSlot, setIsDeletingSlot] = useState(false);

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
          role: tech.specialties?.[0] || 'Nail Tech'
        })));
      } catch (error: any) {
        console.error('Error fetching nail techs:', error);
      } finally {
        setNailTechsLoading(false);
      }
    }
    fetchNailTechs();
  }, []);

  // Fetch slots when date or nail tech changes
  useEffect(() => {
    async function fetchSlots() {
      try {
        setSlotsLoading(true);
        setSlotsError(null);
        
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const params = new URLSearchParams({ date: dateStr });
        
        if (selectedNailTechId && selectedNailTechId !== 'all') {
          params.append('nailTechId', selectedNailTechId);
        }
        
        const response = await fetch(`/api/slots?${params}`);
        if (!response.ok) throw new Error('Failed to fetch slots');
        
        const data = await response.json();
        setSlots(data.slots.map((slot: any) => ({
          id: slot.id || slot._id,
          date: slot.date,
          time: slot.time,
          status: slot.status,
          type: slot.slotType,
          nailTechId: slot.nailTechId,
          nailTechName: nailTechs.find(t => t.id === slot.nailTechId)?.name,
          clientName: slot.booking?.customerName,
          service: slot.booking?.service?.type,
          isHidden: slot.isHidden || false,
        })));
      } catch (error: any) {
        console.error('Error fetching slots:', error);
        setSlotsError(error.message);
      } finally {
        setSlotsLoading(false);
      }
    }

    if (!nailTechsLoading) {
      fetchSlots();
    }
  }, [selectedDate, selectedNailTechId, nailTechsLoading, nailTechs]);

  // Fetch monthly slots for calendar display
  useEffect(() => {
    async function fetchMonthlySlots() {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
        const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
        
        const params = new URLSearchParams({ startDate, endDate });
        
        if (selectedNailTechId && selectedNailTechId !== 'all') {
          params.append('nailTechId', selectedNailTechId);
        }
        
        const response = await fetch(`/api/slots?${params}`);
        if (!response.ok) throw new Error('Failed to fetch monthly slots');
        
        const data = await response.json();
        setMonthlySlots(data.slots.map((slot: any) => ({
          id: slot.id || slot._id,
          date: slot.date,
          time: slot.time,
          status: slot.status,
          type: slot.slotType,
          nailTechId: slot.nailTechId,
          isHidden: slot.isHidden || false,
        })));
      } catch (error: any) {
        console.error('Error fetching monthly slots:', error);
      }
    }

    if (!nailTechsLoading) {
      fetchMonthlySlots();
    }
  }, [currentMonth, selectedNailTechId, nailTechsLoading]);

  const handleAddSlot = async (slotsData: Array<{
    date: string;
    time: string;
    status: BookingStatus;
    type: 'regular' | 'with_squeeze_fee';
    nailTechId: string;
    notes?: string;
  }>) => {
    try {
      setAddingSlots(true);
      setAddSlotsError(null);

      // Extract unique dates and times
      const dates = [...new Set(slotsData.map(s => s.date))];
      const times = [...new Set(slotsData.map(s => s.time))];
      const nailTechId = slotsData[0].nailTechId;
      const status = slotsData[0].status;
      const slotType = slotsData[0].type;
      const notes = slotsData[0].notes;

      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates,
          times,
          nailTechId,
          status,
          slotType,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create slots');
      }

      const data = await response.json();
      
      // Refresh slots for the current date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      if (dates.includes(dateStr)) {
        // Re-fetch slots
        const params = new URLSearchParams({ date: dateStr });
        if (selectedNailTechId && selectedNailTechId !== 'all') {
          params.append('nailTechId', selectedNailTechId);
        }
        
        const refreshResponse = await fetch(`/api/slots?${params}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setSlots(refreshData.slots.map((slot: any) => ({
            id: slot.id || slot._id,
            date: slot.date,
            time: slot.time,
            status: slot.status,
            type: slot.slotType,
            nailTechId: slot.nailTechId,
            nailTechName: nailTechs.find(t => t.id === slot.nailTechId)?.name,
            clientName: slot.booking?.customerName,
            service: slot.booking?.service?.type,
            isHidden: slot.isHidden || false,
          })));
        }
      }

      // Refresh monthly slots for calendar
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
      const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
      
      const monthParams = new URLSearchParams({ startDate, endDate });
      if (selectedNailTechId && selectedNailTechId !== 'all') {
        monthParams.append('nailTechId', selectedNailTechId);
      }
      
      const monthResponse = await fetch(`/api/slots?${monthParams}`);
      if (monthResponse.ok) {
        const monthData = await monthResponse.json();
        setMonthlySlots(monthData.slots.map((slot: any) => ({
          id: slot.id || slot._id,
          date: slot.date,
          time: slot.time,
          status: slot.status,
          type: slot.slotType,
          nailTechId: slot.nailTechId,
          isHidden: slot.isHidden || false,
        })));
      }

      setShowAddSlotModal(false);
    } catch (error: any) {
      console.error('Error creating slots:', error);
      setAddSlotsError(error.message);
    } finally {
      setAddingSlots(false);
    }
  };

  const handleEditSlot = async (slotId: string, updates: {
    status?: BookingStatus;
    slotType?: 'regular' | 'with_squeeze_fee';
    notes?: string;
    isHidden?: boolean;
  }) => {
    try {
      setEditingSlot(true);
      setEditSlotError(null);

      const response = await fetch(`/api/slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update slot');
      }

      // Refresh slots for the current date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const params = new URLSearchParams({ date: dateStr });
      if (selectedNailTechId && selectedNailTechId !== 'all') {
        params.append('nailTechId', selectedNailTechId);
      }
      
      const refreshResponse = await fetch(`/api/slots?${params}`);
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setSlots(refreshData.slots.map((slot: any) => ({
          id: slot.id || slot._id,
          date: slot.date,
          time: slot.time,
          status: slot.status,
          type: slot.slotType,
          nailTechId: slot.nailTechId,
          nailTechName: nailTechs.find(t => t.id === slot.nailTechId)?.name,
          clientName: slot.booking?.customerName,
          service: slot.booking?.service?.type,
          isHidden: slot.isHidden || false,
        })));
      }

      setShowEditSlotModal(false);
      setSelectedSlot(null);
    } catch (error: any) {
      console.error('Error updating slot:', error);
      setEditSlotError(error.message);
    } finally {
      setEditingSlot(false);
    }
  };

  const handleDeleteSlot = (slot: Slot) => {
    setSlotToDelete(slot);
    setShowDeleteConfirmation(true);
    setEditSlotError(null);
  };

  const handleConfirmDelete = async () => {
    if (!slotToDelete) return;

    try {
      setIsDeletingSlot(true);

      const response = await fetch(`/api/slots/${slotToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        let error: any;
        try {
          error = await response.json();
        } catch (e) {
          error = { error: `HTTP ${response.status}` };
        }
        throw new Error(error.error || 'Failed to delete slot');
      }

      // Refresh slots for the current date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const params = new URLSearchParams({ date: dateStr });
      if (selectedNailTechId && selectedNailTechId !== 'all') {
        params.append('nailTechId', selectedNailTechId);
      }
      
      const refreshResponse = await fetch(`/api/slots?${params}`);
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setSlots(refreshData.slots.map((slot: any) => ({
          id: slot.id || slot._id,
          date: slot.date,
          time: slot.time,
          status: slot.status,
          type: slot.slotType,
          nailTechId: slot.nailTechId,
          nailTechName: nailTechs.find(t => t.id === slot.nailTechId)?.name,
          clientName: slot.booking?.customerName,
          service: slot.booking?.service?.type,
          isHidden: slot.isHidden || false,
        })));
      }

      setShowDeleteConfirmation(false);
      setSlotToDelete(null);
      setShowEditSlotModal(false);
      setSelectedSlot(null);
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      setEditSlotError(error.message);
    } finally {
      setIsDeletingSlot(false);
    }
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
          {userRole.canManageAllTechs && !nailTechsLoading && (
            <NailTechFilter
              nailTechs={nailTechs}
              selectedTechId={selectedNailTechId}
              onTechChange={setSelectedNailTechId}
              className="d-none d-md-block"
            />
          )}
          <button
            className="btn btn-dark"
            onClick={() => {
              setAddSlotsError(null);
              setShowAddSlotModal(true);
            }}
            disabled={nailTechsLoading}
          >
            <i className="bi bi-plus-circle me-2"></i>Add Slot
          </button>
        </div>
      </div>

      {/* Mobile Nail Tech Filter */}
      {userRole.canManageAllTechs && !nailTechsLoading && (
        <div className="mb-3 d-md-none">
          <NailTechFilter
            nailTechs={nailTechs}
            selectedTechId={selectedNailTechId}
            onTechChange={setSelectedNailTechId}
          />
        </div>
      )}

      {/* Error Message */}
      {slotsError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {slotsError}
          <button type="button" className="btn-close" onClick={() => setSlotsError(null)}></button>
        </div>
      )}

      {/* Calendar Panel */}
      <div className="row">
        <div className="col-12 col-lg-5" style={{ minWidth: 0 }}>
          <CalendarPanel
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            slots={monthlySlots}
          />
        </div>

        {/* Slot List */}
        <div className="col-12 col-lg-7">
          {slotsLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-dark" role="status">
                <span className="visually-hidden">Loading slots...</span>
              </div>
              <p className="mt-2 text-muted">Loading slots...</p>
            </div>
          ) : (
            <SlotList
              date={selectedDate}
              slots={slots.map((slot) => ({
                ...slot,
                nailTechRole: nailTechs.find((t) => t.id === slot.nailTechId)?.role,
              }))}
              onSlotClick={handleSlotClick}
              onView={(slot) => handleSlotClick(slot)}
              onEdit={(slot) => {
                setSelectedSlot(slot);
                setShowEditSlotModal(true);
                setEditSlotError(null);
              }}
              onCancel={(slot) => {
                handleDeleteSlot(slot);
              }}
            />
          )}
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
      {showAddSlotModal && (
        <>
          <AddSlotModal
            show={showAddSlotModal}
            onHide={() => {
              if (!addingSlots) {
                setShowAddSlotModal(false);
                setAddSlotsError(null);
              }
            }}
            onAdd={handleAddSlot}
            selectedDate={selectedDate}
            nailTechs={userRole.canManageAllTechs ? nailTechs : nailTechs.filter((t) => t.id === userRole.assignedNailTechId)}
            defaultNailTechId={userRole.assignedNailTechId}
            existingSlots={slots.map((slot) => ({
              date: slot.date,
              time: slot.time,
              nailTechId: slot.nailTechId,
            }))}
          />
          {addingSlots && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div className="text-center text-white">
                <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Creating slots...</span>
                </div>
                <p className="mt-3 fs-5">Creating slots...</p>
              </div>
            </div>
          )}
          {addSlotsError && (
            <div 
              className="position-fixed top-0 start-50 translate-middle-x mt-3"
              style={{ zIndex: 2001 }}
            >
              <div className="alert alert-danger alert-dismissible fade show shadow-lg" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {addSlotsError}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setAddSlotsError(null)}
                ></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Slot Modal */}
      <EditSlotModal
        show={showEditSlotModal}
        onHide={() => {
          if (!editingSlot) {
            setShowEditSlotModal(false);
            setSelectedSlot(null);
            setEditSlotError(null);
          }
        }}
        onUpdate={handleEditSlot}
        onDelete={handleDeleteSlot}
        slot={selectedSlot ? {
          id: selectedSlot.id,
          date: selectedSlot.date || format(selectedDate, 'yyyy-MM-dd'),
          time: selectedSlot.time,
          status: selectedSlot.status,
          type: selectedSlot.type as 'regular' | 'with_squeeze_fee',
          nailTechId: selectedSlot.nailTechId,
          nailTechName: selectedSlot.nailTechName,
          notes: undefined,
          isHidden: selectedSlot.isHidden,
        } : undefined}
        isLoading={editingSlot}
        error={editSlotError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteConfirmation}
        title="Delete Slot"
        message="Are you sure you want to delete this slot?"
        slotDate={slotToDelete?.date}
        slotTime={slotToDelete?.time}
        nailTechName={slotToDelete?.nailTechName}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirmation(false);
          setSlotToDelete(null);
          setEditSlotError(null);
        }}
        isLoading={isDeletingSlot}
      />
    </div>
  );
}
