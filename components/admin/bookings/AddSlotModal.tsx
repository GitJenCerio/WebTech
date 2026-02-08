import React, { useState, useMemo } from 'react';
import { BookingStatus } from '../StatusBadge';

export type SlotType = 'regular' | 'with_squeeze_fee';
type AddMode = 'single' | 'bulk';

interface NailTech {
  id: string;
  name: string;
  role?: string;
}

interface ExistingSlot {
  date: string;
  time: string;
  nailTechId: string;
}

interface AddSlotModalProps {
  show: boolean;
  onHide: () => void;
  onAdd: (slots: Array<{
    date: string;
    time: string;
    status: BookingStatus;
    type: SlotType;
    nailTechId: string;
    notes?: string;
  }>) => void;
  selectedDate?: Date;
  nailTechs?: NailTech[];
  defaultNailTechId?: string;
  existingSlots?: ExistingSlot[];
}

// Generate time options from 7:00 AM to 9:00 PM with 30-minute increments
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const date = new Date(`2000-01-01T${time24}`);
      const time12 = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      times.push(time12);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

// Helper function to convert Date to YYYY-MM-DD string using local timezone (not UTC)
const dateToLocalISOString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddSlotModal({
  show,
  onHide,
  onAdd,
  selectedDate,
  nailTechs = [],
  defaultNailTechId,
  existingSlots = [],
}: AddSlotModalProps) {
  const [addMode, setAddMode] = useState<AddMode>('single');
  const [selectedNailTechId, setSelectedNailTechId] = useState<string>(
    defaultNailTechId || (nailTechs.length > 0 ? nailTechs[0].id : '')
  );
  const [startDate, setStartDate] = useState(
    selectedDate
      ? dateToLocalISOString(selectedDate)
      : dateToLocalISOString(new Date())
  );
  const [endDate, setEndDate] = useState(
    selectedDate
      ? dateToLocalISOString(selectedDate)
      : dateToLocalISOString(new Date())
  );
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [status, setStatus] = useState<BookingStatus>('available');
  const [slotType, setSlotType] = useState<SlotType>('regular');
  const [notes, setNotes] = useState('');

  // Get already added times for the selected nail tech and date
  const addedTimesForDate = useMemo(() => {
    if (!selectedNailTechId) return new Set<string>();
    return new Set(
      existingSlots
        .filter((slot) => slot.nailTechId === selectedNailTechId && slot.date === startDate)
        .map((slot) => slot.time)
    );
  }, [selectedNailTechId, startDate, existingSlots]);

  // Available times (not yet added for selected tech and date)
  const availableTimeOptions = useMemo(() => {
    return timeOptions.filter((time) => !addedTimesForDate.has(time));
  }, [addedTimesForDate]);

  const handleTimeToggle = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time)
        ? prev.filter((t) => t !== time)
        : [...prev, time].sort((a, b) => {
            const timeA = new Date(`2000-01-01 ${a}`);
            const timeB = new Date(`2000-01-01 ${b}`);
            return timeA.getTime() - timeB.getTime();
          })
    );
  };

  const handleSelectAllTimes = () => {
    if (selectedTimes.length === availableTimeOptions.length) {
      setSelectedTimes([]);
    } else {
      setSelectedTimes([...availableTimeOptions]);
    }
  };

  const getDatesInRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    for (
      let date = new Date(startDateObj);
      date <= endDateObj;
      date.setDate(date.getDate() + 1)
    ) {
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNailTechId || selectedTimes.length === 0) {
      return;
    }

    const dates = addMode === 'single' ? [startDate] : getDatesInRange(startDate, endDate);
    const slots: Array<{
      date: string;
      time: string;
      status: BookingStatus;
      type: SlotType;
      nailTechId: string;
      notes?: string;
    }> = [];

    dates.forEach((date) => {
      selectedTimes.forEach((time) => {
        slots.push({
          date,
          time,
          status,
          type: slotType,
          nailTechId: selectedNailTechId,
          notes: notes || undefined,
        });
      });
    });

    onAdd(slots);

    // Reset form
    setSelectedTimes([]);
    setNotes('');
    setStatus('available');
    setSlotType('regular');
    setAddMode('single');
    onHide();
  };

  if (!show) return null;

  const datesInRange = addMode === 'single' ? [startDate] : getDatesInRange(startDate, endDate);
  const totalSlots = selectedTimes.length * datesInRange.length;

  return (
    <>
      <div
        className={`modal fade ${show ? 'show' : ''}`}
        style={{ 
          display: show ? 'flex' : 'none', 
          zIndex: 1055,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        tabIndex={-1}
        role="dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onHide();
          }
        }}
      >
        <div 
          className="modal-dialog modal-dialog-centered" 
          style={{ 
            margin: '0 auto', 
            position: 'relative',
            maxWidth: '650px',
            width: '100%'
          }} 
          role="document" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="modal-header" style={{ padding: '0.75rem 1rem' }}>
              <h5 className="modal-title" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {addMode === 'single' ? 'Add Slot' : 'Add Bulk Slots'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onHide}
                aria-label="Close"
                style={{ padding: '0.5rem' }}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ padding: '1rem', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                <div className="row g-2 g-md-3">
                  {/* Step 1: Select Nail Tech First */}
                  {nailTechs.length > 0 && (
                    <div className="col-12">
                      <label htmlFor="nailTech" className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                        Nail Technician <span className="text-danger">*</span>
                      </label>
                      <select
                        id="nailTech"
                        className="form-select"
                        value={selectedNailTechId}
                        onChange={(e) => {
                          setSelectedNailTechId(e.target.value);
                          setSelectedTimes([]);
                        }}
                        required
                      >
                        <option value="">-- Select Nail Tech --</option>
                        {nailTechs.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} {tech.role ? `(${tech.role})` : ''}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        Select the nail tech first to see available time slots
                      </small>
                    </div>
                  )}

                  {/* Step 2: Toggl Add Mode */}
                  {selectedNailTechId && (
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                        Add Mode
                      </label>
                      <div className="btn-group w-100" role="group">
                        <button
                          type="button"
                          className={`btn ${addMode === 'single' ? 'btn-dark' : 'btn-outline-secondary'}`}
                          onClick={() => {
                            setAddMode('single');
                            setSelectedTimes([]);
                          }}
                          style={{ fontSize: '0.875rem' }}
                        >
                          <i className="bi bi-calendar-day me-2"></i>Add Single Day
                        </button>
                        <button
                          type="button"
                          className={`btn ${addMode === 'bulk' ? 'btn-dark' : 'btn-outline-secondary'}`}
                          onClick={() => {
                            setAddMode('bulk');
                            setSelectedTimes([]);
                          }}
                          style={{ fontSize: '0.875rem' }}
                        >
                          <i className="bi bi-calendar-range me-2"></i>Add Bulk
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Date Selection */}
                  {selectedNailTechId && (
                    <>
                      {addMode === 'single' ? (
                        <div className="col-12">
                          <label htmlFor="singleDate" className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                            Date <span className="text-danger">*</span>
                          </label>
                          <input
                            type="date"
                            id="singleDate"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              setEndDate(e.target.value);
                              setSelectedTimes([]);
                            }}
                            required
                          />
                          <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                            <strong>{addedTimesForDate.size}</strong> slots already added on this day
                          </small>
                        </div>
                      ) : (
                        <>
                          <div className="col-12 col-sm-6">
                            <label htmlFor="startDate" className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                              Start Date <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              id="startDate"
                              className="form-control"
                              value={startDate}
                              onChange={(e) => {
                                setStartDate(e.target.value);
                                setSelectedTimes([]);
                              }}
                              required
                            />
                          </div>

                          <div className="col-12 col-sm-6">
                            <label htmlFor="endDate" className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                              End Date <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              id="endDate"
                              className="form-control"
                              value={endDate}
                              onChange={(e) => {
                                setEndDate(e.target.value);
                                setSelectedTimes([]);
                              }}
                              required
                              min={startDate}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Step 4: Time Selection */}
                  {selectedNailTechId && (
                    <div className="col-12">
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2">
                        <label className="form-label fw-semibold mb-0" style={{ fontSize: '0.875rem' }}>
                          Select Time Slots <span className="text-danger">*</span>
                        </label>
                        {availableTimeOptions.length > 0 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={handleSelectAllTimes}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                          >
                            {selectedTimes.length === availableTimeOptions.length
                              ? 'Deselect All'
                              : 'Select All'}
                          </button>
                        )}
                      </div>
                      {availableTimeOptions.length > 0 ? (
                        <div
                          className="border rounded p-2"
                          style={{
                            maxHeight: '220px',
                            overflowY: 'auto',
                            backgroundColor: '#f8f9fa',
                          }}
                        >
                          <div className="row g-2">
                            {availableTimeOptions.map((time) => (
                              <div key={time} className="col-6 col-sm-4">
                                <button
                                  type="button"
                                  className={`btn btn-sm w-100 ${
                                    selectedTimes.includes(time)
                                      ? 'btn-dark'
                                      : 'btn-outline-secondary'
                                  }`}
                                  onClick={() => handleTimeToggle(time)}
                                  style={{ 
                                    fontSize: '0.75rem', 
                                    padding: '0.375rem 0.5rem',
                                    minHeight: '32px'
                                  }}
                                >
                                  {time}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="alert alert-warning mb-0" style={{ fontSize: '0.85rem' }}>
                          <i className="bi bi-info-circle me-2"></i>
                          All available time slots are already added for this {addMode === 'single' ? 'day' : 'nail tech'}.
                        </div>
                      )}
                      {selectedTimes.length > 0 && (
                        <small className="text-muted mt-2 d-block" style={{ fontSize: '0.75rem' }}>
                          {selectedTimes.length} time{selectedTimes.length !== 1 ? 's' : ''} selected
                        </small>
                      )}
                    </div>
                  )}

                  {/* Step 5: Slot Configuration */}
                  {selectedNailTechId && selectedTimes.length > 0 && (
                    <>
                      <div className="col-12 col-sm-6">
                        <label htmlFor="slotStatus" className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                          Status
                        </label>
                        <select
                          id="slotStatus"
                          className="form-select"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as BookingStatus)}
                        >
                          <option value="available">Available</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>

                      <div className="col-12 col-sm-6">
                        <label htmlFor="slotType" className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                          Slot Type
                        </label>
                        <select
                          id="slotType"
                          className="form-select"
                          value={slotType}
                          onChange={(e) => setSlotType(e.target.value as SlotType)}
                        >
                          <option value="regular">Regular</option>
                          <option value="with_squeeze_fee">With Squeeze-in Fee</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                          Total Slots to Create
                        </label>
                        <div className="form-control bg-light fw-bold" style={{ fontSize: '0.875rem' }}>
                          {totalSlots} slot{totalSlots !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="col-12">
                        <label htmlFor="slotNotes" className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                          Notes (Optional)
                        </label>
                        <textarea
                          id="slotNotes"
                          className="form-control"
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add any notes about these slots..."
                          style={{ fontSize: '0.875rem' }}
                        ></textarea>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '0.75rem 1rem', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onHide}
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={!selectedNailTechId || selectedTimes.length === 0}
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add {totalSlots} Slot{totalSlots !== 1 ? 's' : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {show && (
        <div
          className="modal-backdrop fade show"
          style={{ zIndex: 1050 }}
          onClick={onHide}
        ></div>
      )}
    </>
  );
}
