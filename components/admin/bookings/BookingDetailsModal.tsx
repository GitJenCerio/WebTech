import React from 'react';
import StatusBadge, { BookingStatus } from '../StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { sortTimesChronologically, formatTime12Hour } from '@/lib/utils';

interface BookingDetailsModalProps {
  show: boolean;
  onHide: () => void;
  booking: {
    id?: string;
    bookingCode?: string;
    customerId?: string;
    date: string;
    time: string;
    slotTimes?: string[];
    slotType?: 'regular' | 'with_squeeze_fee' | null;
    serviceLocation?: 'homebased_studio' | 'home_service';
    invoice?: { quotationId?: string; total?: number; createdAt?: string } | null;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    clientSocialMediaName?: string;
    service: string;
    status: BookingStatus;
    notes?: string;
    adminNotes?: string;
    paymentStatus?: string;
    slotCount?: number;
    reservationAmount?: number;
    depositRequired?: number;
    paymentProofUrl?: string;
    completedAt?: string | null;
    clientPhotos?: {
      inspiration?: Array<{ url?: string }>;
      currentState?: Array<{ url?: string }>;
    };
  } | null;
  onMarkComplete?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
  onMarkNoShow?: () => void;
  onCreateInvoice?: () => void;
  onVerifyPaymentProof?: () => void;
  isVerifyingPaymentProof?: boolean;
  onAdminNotesChange?: (value: string) => void;
  onSaveNotes?: () => void;
  adminNotesDraft?: string;
}

export default function BookingDetailsModal({
  show,
  onHide,
  booking,
  onMarkComplete,
  onCancel,
  onReschedule,
  onMarkNoShow,
  onCreateInvoice,
  onVerifyPaymentProof,
  isVerifyingPaymentProof = false,
  onAdminNotesChange,
  onSaveNotes,
  adminNotesDraft = '',
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const isPendingPayment = ['booked', 'PENDING_PAYMENT', 'pending'].includes(booking.status);
  const isCompleted = Boolean(booking.completedAt) || ['completed', 'COMPLETED'].includes(booking.status);
  const canVerify = Boolean(booking.paymentProofUrl && onVerifyPaymentProof);
  const paymentStatusLabel = booking.paymentStatus?.toLowerCase() === 'paid'
    ? 'Paid'
    : booking.paymentStatus?.toLowerCase() === 'partial'
      ? 'Partial'
      : 'Unpaid';
  const contactValue = booking.clientPhone || booking.clientEmail || '-';

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3" style={{ fontSize: '0.92rem' }}>
          <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50">
            <div className="flex flex-col gap-2">
              {booking.bookingCode && (
                <div><strong>Booking Code:</strong> {booking.bookingCode}</div>
              )}
              <div><strong>Date:</strong> {booking.date}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span><strong>Time:</strong> {(booking.slotTimes && booking.slotTimes.length > 0)
                  ? sortTimesChronologically(booking.slotTimes).map(formatTime12Hour).join(' & ')
                  : formatTime12Hour(booking.time)}
                </span>
                {booking.slotType === 'with_squeeze_fee' && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">Squeeze</span>
                )}
              </div>
              {booking.serviceLocation && (
                <div>
                  <strong>Location:</strong>{' '}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    booking.serviceLocation === 'home_service'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {booking.serviceLocation === 'home_service' ? 'Home Service' : 'Studio'}
                  </span>
                </div>
              )}
              <div><strong>Client:</strong> {booking.clientName}</div>
                {booking.clientSocialMediaName && (
                  <div><strong>Social:</strong> {booking.clientSocialMediaName}</div>
                )}
                <div><strong>Contact:</strong> {contactValue}</div>
                <div><strong>Service:</strong> {booking.service}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span><strong>Reservation Fee:</strong></span>
                  <Badge
                    variant={
                      paymentStatusLabel === 'Paid'
                        ? 'success'
                        : paymentStatusLabel === 'Partial'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {paymentStatusLabel === 'Paid' || paymentStatusLabel === 'Partial' ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>
            </div>
          </div>

          {booking.paymentProofUrl && (
            <div>
              <label className="text-sm font-semibold mb-2 block">Payment Proof</label>
              <div className="mb-2">
                <img
                  src={booking.paymentProofUrl}
                  alt="Payment proof"
                  className="w-full rounded-2xl border border-gray-200"
                  style={{ maxHeight: '220px', objectFit: 'contain', background: '#f8f9fa' }}
                />
              </div>
              <a
                href={booking.paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-[#212529]"
              >
                Open full image
              </a>
            </div>
          )}

          {((booking.clientPhotos?.currentState?.length ?? 0) > 0 || (booking.clientPhotos?.inspiration?.length ?? 0) > 0) && (
            <div>
              <label className="text-sm font-semibold mb-2 block">Client Photos</label>
              <div className="space-y-3">
                {(booking.clientPhotos?.currentState?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Current nails</p>
                    <div className="flex flex-wrap gap-2">
                      {booking.clientPhotos.currentState.filter(p => p.url).map((p, i) => (
                        <a
                          key={i}
                          href={p.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded-lg border border-gray-200 overflow-hidden hover:border-gray-400 transition-colors"
                        >
                          <img src={p.url!} alt={`Current nails ${i + 1}`} className="h-20 w-20 object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {(booking.clientPhotos?.inspiration?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Nail inspo</p>
                    <div className="flex flex-wrap gap-2">
                      {booking.clientPhotos.inspiration.filter(p => p.url).map((p, i) => (
                        <a
                          key={i}
                          href={p.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded-lg border border-gray-200 overflow-hidden hover:border-gray-400 transition-colors"
                        >
                          <img src={p.url!} alt={`Nail inspo ${i + 1}`} className="h-20 w-20 object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {booking.notes && (
            <div>
              <label className="text-sm font-semibold mb-2 block">Client Notes</label>
              <div className="text-gray-600">{booking.notes}</div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold mb-2 block">Admin Notes</label>
            <Textarea
              rows={3}
              value={adminNotesDraft}
              onChange={(e) => onAdminNotesChange?.(e.target.value)}
              placeholder="Add internal notes..."
              className="mb-2"
            />
            <small className="text-gray-500 text-xs">Visible to admins only.</small>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveNotes}
                disabled={!onSaveNotes}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>

          {isPendingPayment ? (
            <>
              <Button
                variant="default"
                onClick={onVerifyPaymentProof}
                disabled={!canVerify || isVerifyingPaymentProof}
                loading={isVerifyingPaymentProof}
              >
                <i className="bi bi-shield-check mr-2"></i>
                {isVerifyingPaymentProof ? 'Verifying...' : 'Verify Payment Proof'}
              </Button>
              <Button
                variant="destructive"
                onClick={onCancel}
                disabled={!onCancel}
              >
                <i className="bi bi-x-circle mr-2"></i>Cancel
              </Button>
            </>
          ) : isCompleted ? (
            <Button
              variant="outline"
              onClick={onCreateInvoice}
              disabled={!onCreateInvoice}
            >
              <i className="bi bi-receipt mr-2"></i>
              {booking.invoice?.quotationId ? 'View / Edit Invoice' : 'Create Invoice'}
            </Button>
          ) : (
            ['CONFIRMED', 'confirmed'].includes(booking.status) && (
              <>
                <Button
                  variant="outline"
                  onClick={onCreateInvoice}
                  disabled={!onCreateInvoice}
                >
                  <i className="bi bi-receipt mr-2"></i>
                  {booking.invoice?.quotationId ? 'View / Edit Invoice' : 'Create Invoice'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onReschedule}
                  disabled={!onReschedule}
                >
                  <i className="bi bi-calendar-event mr-2"></i>Reschedule
                </Button>
                <Button
                  variant="outline"
                  onClick={onMarkNoShow}
                  disabled={!onMarkNoShow}
                >
                  <i className="bi bi-person-x mr-2"></i>No Show
                </Button>
                <Button
                  variant="default"
                  onClick={onMarkComplete}
                  disabled={!onMarkComplete}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <i className="bi bi-check-circle mr-2"></i>Mark Complete
                </Button>
                <Button
                  variant="destructive"
                  onClick={onCancel}
                  disabled={!onCancel}
                >
                  <i className="bi bi-x-circle mr-2"></i>Cancel
                </Button>
              </>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
