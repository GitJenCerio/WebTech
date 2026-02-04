import React, { useState } from 'react';
import { BookingStatus } from '../StatusBadge';

export type SlotType = 'regular' | 'with_squeeze_fee';

interface NailTech {
  id: string;
  name: string;
  role?: string;
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

export default function AddSlotModal({
  show,
  onHide,
  onAdd,
  selectedDate,
  nailTechs = [],
  defaultNailTechId,
}: AddSlotModalProps) {
  const [startDate, setStartDate] = useState(
    selectedDate
      ? selectedDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    selectedDate
      ? selectedDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [status, setStatus] = useState<BookingStatus>('available');
  const [slotType, setSlotType] = useState<SlotType>('regular');
  const [selectedNailTechId, setSelectedNailTechId] = useState<string>(
    defaultNailTechId || (nailTechs.length > 0 ? nailTechs[0].id : '')
  );
  const [notes, setNotes] = useState('');

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
    if (selectedTimes.length === timeOptions.length) {
      setSelectedTimes([]);
    } else {
      setSelectedTimes([...timeOptions]);
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
    if (!startDate || !endDate || selectedTimes.length === 0) {
      return;
    }

    const dates = getDatesInRange(startDate, endDate);
    const slots: Array<{
      date: string;
      time: string;
      status: BookingStatus;
      type: SlotType;
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
    setSelectedNailTechId(defaultNailTechId || (nailTechs.length > 0 ? nailTechs[0].id : ''));
    onHide();
  };

  if (!show) return null;

  const totalSlots = selectedTimes.length * (getDatesInRange(startDate, endDate).length);

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
          justifyContent: 'center'
        }}
        tabIndex={-1}
        role="dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onHide();
          }
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg" style={{ margin: '1rem auto', position: 'relative' }} role="document" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Slots (Bulk)</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onHide}
                aria-label="Close"
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="startDate" className="form-label fw-semibold">
                      Start Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="endDate" className="form-label fw-semibold">
                      End Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      min={startDate}
                    />
                  </div>

                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-semibold mb-0">
                        Select Times <span className="text-danger">*</span>
                      </label>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleSelectAllTimes}
                      >
                        {selectedTimes.length === timeOptions.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    </div>
                    <div
                      className="border rounded p-3"
                      style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        backgroundColor: '#f8f9fa',
                      }}
                    >
                      <div className="row g-2">
                        {timeOptions.map((time) => (
                          <div key={time} className="col-6 col-md-4 col-lg-3">
                            <button
                              type="button"
                              className={`btn btn-sm w-100 ${
                                selectedTimes.includes(time)
                                  ? 'btn-dark'
                                  : 'btn-outline-secondary'
                              }`}
                              onClick={() => handleTimeToggle(time)}
                            >
                              {time}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedTimes.length > 0 && (
                      <small className="text-muted mt-2 d-block">
                        {selectedTimes.length} time{selectedTimes.length !== 1 ? 's' : ''} selected
                      </small>
                    )}
                  </div>

                  {nailTechs.length > 0 && (
                    <div className="col-12">
                      <label htmlFor="nailTech" className="form-label fw-semibold">
                        Nail Tech <span className="text-danger">*</span>
                      </label>
                      <select
                        id="nailTech"
                        className="form-select"
                        value={selectedNailTechId}
                        onChange={(e) => setSelectedNailTechId(e.target.value)}
                        required
                      >
                        {nailTechs.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} {tech.role ? `(${tech.role})` : ''}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">
                        Select the nail tech these slots will be assigned to
                      </small>
                    </div>
                  )}

                  <div className="col-12 col-md-6">
                    <label htmlFor="slotStatus" className="form-label fw-semibold">
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

                  <div className="col-12 col-md-6">
                    <label htmlFor="slotType" className="form-label fw-semibold">
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
                    <label className="form-label fw-semibold">
                      Total Slots to Create
                    </label>
                    <div className="form-control bg-light">
                      <strong>{totalSlots}</strong> slot{totalSlots !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="col-12">
                    <label htmlFor="slotNotes" className="form-label fw-semibold">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="slotNotes"
                      className="form-control"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about these slots..."
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onHide}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={selectedTimes.length === 0}
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
