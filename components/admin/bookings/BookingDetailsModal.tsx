import React from 'react';
import StatusBadge, { BookingStatus } from '../StatusBadge';

interface BookingDetailsModalProps {
  show: boolean;
  onHide: () => void;
  booking: {
    id?: string;
    bookingCode?: string;
    date: string;
    time: string;
    clientName: string;
    service: string;
    status: BookingStatus;
    notes?: string;
    paymentStatus?: string;
    slotCount?: number;
    reservationAmount?: number;
    depositRequired?: number;
    paymentProofUrl?: string;
  } | null;
  onMarkComplete?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
  onMarkNoShow?: () => void;
  onVerifyPaymentProof?: () => void;
  isVerifyingPaymentProof?: boolean;
}

export default function BookingDetailsModal({
  show,
  onHide,
  booking,
  onMarkComplete,
  onCancel,
  onReschedule,
  onMarkNoShow,
  onVerifyPaymentProof,
  isVerifyingPaymentProof = false,
}: BookingDetailsModalProps) {
  if (!show || !booking) return null;

  const isPendingPayment = ['booked', 'PENDING_PAYMENT', 'pending'].includes(booking.status);
  const canVerify = Boolean(booking.paymentProofUrl && onVerifyPaymentProof);

  return (
    <div
      className={`modal fade ${show ? 'show' : ''}`}
      style={{
        display: show ? 'flex' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1055,
      }}
      tabIndex={-1}
      role="dialog"
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 0,
        }}
        onClick={onHide}
      />

      <div
        className="modal-dialog modal-dialog-centered"
        style={{ margin: '0.5rem auto', position: 'relative', zIndex: 1, width: 'min(96vw, 680px)' }}
        role="document"
      >
        <div className="modal-content">
          <div className="modal-header py-2 px-3">
            <h5 className="modal-title">Booking Details</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onHide}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body p-3" style={{ fontSize: '0.92rem' }}>
            <div className="mb-2 p-2 border rounded bg-light">
              <div className="d-flex flex-column gap-1">
                {booking.bookingCode ? <div><strong>Booking Code:</strong> {booking.bookingCode}</div> : null}
                <div><strong>Client:</strong> {booking.clientName}</div>
                <div><strong>Date:</strong> {booking.date}</div>
                <div><strong>Time:</strong> {booking.time}</div>
              </div>
            </div>

            <div className="mb-2 p-2 border rounded bg-light">
              <div className="d-flex flex-wrap gap-3">
                <span><strong>Service:</strong> {booking.service}</span>
                {booking.paymentStatus && booking.paymentStatus.toLowerCase() !== 'unpaid' ? (
                  <span><strong>Payment:</strong> {booking.paymentStatus}</span>
                ) : null}
              </div>
            </div>

            <div className="mb-2 d-flex align-items-center gap-2 flex-wrap">
              <span className="fw-semibold">Status:</span>
              <StatusBadge status={booking.status} />
            </div>

            {booking.reservationAmount ? (
              <div className="mb-2">
                <label className="form-label fw-semibold mb-1">Reservation Fee</label>
                <div>
                  PHP 500 x {booking.slotCount || 1} slot{(booking.slotCount || 1) > 1 ? 's' : ''} = PHP {booking.reservationAmount.toLocaleString()}
                </div>
              </div>
            ) : null}

            {booking.paymentProofUrl && (
              <div className="mb-2">
                <label className="form-label fw-semibold mb-1">Payment Proof</label>
                <div className="mb-1">
                  <img
                    src={booking.paymentProofUrl}
                    alt="Payment proof"
                    className="img-fluid rounded border"
                    style={{ maxHeight: '220px', objectFit: 'contain', background: '#f8f9fa' }}
                  />
                </div>
                <a
                  href={booking.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="small"
                >
                  Open full image
                </a>
              </div>
            )}

            {booking.notes && (
              <div className="mb-2">
                <label className="form-label fw-semibold mb-1">Notes</label>
                <div className="text-muted">{booking.notes}</div>
              </div>
            )}
          </div>

          <div className="modal-footer py-2 px-3">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Close
            </button>

            {isPendingPayment ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onVerifyPaymentProof}
                  disabled={!canVerify || isVerifyingPaymentProof}
                >
                  <i className="bi bi-shield-check me-2"></i>
                  {isVerifyingPaymentProof ? 'Verifying...' : 'Verify Payment Proof'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={onCancel}
                  disabled={!onCancel}
                >
                  <i className="bi bi-x-circle me-2"></i>Cancel
                </button>
              </>
            ) : (
              ['CONFIRMED', 'confirmed'].includes(booking.status) && (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onReschedule}
                    disabled={!onReschedule}
                  >
                    <i className="bi bi-calendar-event me-2"></i>Reschedule
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={onMarkNoShow}
                    disabled={!onMarkNoShow}
                  >
                    <i className="bi bi-person-x me-2"></i>No Show
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={onMarkComplete}
                    disabled={!onMarkComplete}
                  >
                    <i className="bi bi-check-circle me-2"></i>Mark Complete
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={onCancel}
                    disabled={!onCancel}
                  >
                    <i className="bi bi-x-circle me-2"></i>Cancel
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
