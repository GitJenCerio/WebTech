import React from 'react';
import StatusBadge, { BookingStatus } from '../StatusBadge';

interface BookingDetailsModalProps {
  show: boolean;
  onHide: () => void;
  booking: {
    date: string;
    time: string;
    clientName: string;
    service: string;
    status: BookingStatus;
    notes?: string;
    paymentStatus?: string;
    amount?: number;
  } | null;
  onMarkComplete?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
}

export default function BookingDetailsModal({
  show,
  onHide,
  booking,
  onMarkComplete,
  onCancel,
  onReschedule,
}: BookingDetailsModalProps) {
  if (!show || !booking) return null;

  return (
    <div
      className={`modal fade ${show ? 'show' : ''}`}
      style={{ display: show ? 'block' : 'none' }}
      tabIndex={-1}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Booking Details</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onHide}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label fw-semibold">Date & Time</label>
              <div>
                {booking.date} at {booking.time}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Client</label>
              <div>{booking.clientName}</div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Service</label>
              <div>{booking.service}</div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Status</label>
              <div>
                <StatusBadge status={booking.status} />
              </div>
            </div>

            {booking.paymentStatus && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Payment Status</label>
                <div>{booking.paymentStatus}</div>
              </div>
            )}

            {booking.amount && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Amount</label>
                <div>₱{booking.amount.toLocaleString()}</div>
              </div>
            )}

            {booking.notes && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Notes</label>
                <div className="text-muted">{booking.notes}</div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Close
            </button>
            {booking.status === 'booked' && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onReschedule}
                >
                  <i className="bi bi-calendar-event me-2"></i>Reschedule
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={onMarkComplete}
                >
                  <i className="bi bi-check-circle me-2"></i>Mark Complete
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={onCancel}
                >
                  <i className="bi bi-x-circle me-2"></i>Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {show && (
        <div className="modal-backdrop fade show" onClick={onHide}></div>
      )}
    </div>
  );
}
