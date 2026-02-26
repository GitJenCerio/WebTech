import React, { useState } from 'react';
import { Calendar, MapPin, Phone, AtSign, Sparkles, CreditCard, User } from 'lucide-react';
import StatusBadge, { BookingStatus } from '../StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { format } from 'date-fns';
import { sortTimesChronologically, formatTime12Hour } from '@/lib/utils';

function formatDateYyyyMmDd(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
}

const iconSize = 14;

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
    nailTechName?: string;
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
  onManualConfirmPayment?: (amountPaid: number) => Promise<void>;
  isManualConfirming?: boolean;
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
  onManualConfirmPayment,
  isManualConfirming = false,
  onAdminNotesChange,
  onSaveNotes,
  adminNotesDraft = '',
}: BookingDetailsModalProps) {
  const [showManualConfirmDialog, setShowManualConfirmDialog] = useState(false);
  const [manualAmount, setManualAmount] = useState<number>(0);

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
  const timeStr = (booking.slotTimes && booking.slotTimes.length > 0)
    ? sortTimesChronologically(booking.slotTimes).map(formatTime12Hour).join(' & ')
    : formatTime12Hour(booking.time);
  const formattedDate = formatDateYyyyMmDd(booking.date);
  const dateTimeStr = `${formattedDate} · ${timeStr}`;
  const locationLabel = booking.serviceLocation === 'home_service' ? 'Home Service' : booking.serviceLocation === 'homebased_studio' ? 'Homebased Studio' : '';
  const isConfirmed = ['CONFIRMED', 'confirmed'].includes(booking.status);
  const isCompletedStatus = ['COMPLETED', 'completed'].includes(booking.status);

  const getStatusBadge = () => {
    const label = booking.status === 'CONFIRMED' || booking.status === 'confirmed' ? 'CONFIRMED'
      : booking.status === 'COMPLETED' || booking.status === 'completed' ? 'COMPLETED'
      : booking.status === 'PENDING_PAYMENT' || booking.status === 'pending' || booking.status === 'booked' ? 'PENDING'
      : String(booking.status).toUpperCase().replace(/-/g, ' ');
    if (isConfirmed) {
      return <span className="inline-flex items-center rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-white bg-emerald-600">CONFIRMED</span>;
    }
    if (isCompletedStatus) {
      return <span className="inline-flex items-center rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-white bg-gray-700">COMPLETED</span>;
    }
    return <StatusBadge status={booking.status} />;
  };

  return (
    <>
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-2xl md:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-white border border-[#e5e5e5] shadow-sm relative sm:p-3">
            <div className="flex justify-between items-start gap-3 mb-2">
              <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-gray-500">BOOKING</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {booking.slotType === 'with_squeeze_fee' && (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold ${
                    booking.serviceLocation === 'home_service'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>SQ</span>
                )}
                {getStatusBadge()}
              </div>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-[#1a1a1a]">{booking.clientName}</h3>
            {booking.bookingCode && (
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{booking.bookingCode}</p>
            )}
            <div className="flex flex-col gap-1.5 mt-3 text-xs sm:text-sm text-[#1a1a1a]">
              <div className="flex items-center gap-2">
                <Calendar size={iconSize} className="text-gray-500 flex-shrink-0" strokeWidth={2} />
                <span>{formattedDate} · <span className="whitespace-nowrap">{timeStr}</span></span>
              </div>
              {booking.nailTechName && (
                <div className="flex items-center gap-2">
                  <User size={iconSize} className="text-gray-500 flex-shrink-0" strokeWidth={2} />
                  <span>Ms. {booking.nailTechName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Phone size={iconSize} className="text-gray-500 flex-shrink-0" strokeWidth={2} />
                <span>{contactValue}</span>
              </div>
              {booking.clientSocialMediaName && (
                <div className="flex items-center gap-2">
                  <AtSign size={iconSize} className="text-gray-500 flex-shrink-0" strokeWidth={2} />
                  <span>{booking.clientSocialMediaName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Sparkles size={iconSize} className="text-gray-500 flex-shrink-0" strokeWidth={2} />
                <span>{booking.service}</span>
              </div>
              {locationLabel && (
                <div className="flex items-center gap-2">
                  <MapPin size={iconSize} className="text-gray-500 flex-shrink-0" strokeWidth={2} />
                  <span>{locationLabel}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CreditCard size={iconSize} className="text-gray-500 flex-shrink-0" strokeWidth={2} />
                <span
                    className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] sm:text-xs font-medium ${
                    paymentStatusLabel === 'Paid'
                      ? 'bg-emerald-600 text-white'
                      : paymentStatusLabel === 'Partial'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {paymentStatusLabel === 'Paid' || paymentStatusLabel === 'Partial' ? 'Paid' : 'Unpaid'}
                </span>
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
                      {(booking.clientPhotos?.currentState ?? []).filter(p => p.url).map((p, i) => (
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
                      {(booking.clientPhotos?.inspiration ?? []).filter(p => p.url).map((p, i) => (
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
                variant="outline"
                onClick={() => {
                  setManualAmount(booking.reservationAmount ?? 0);
                  setShowManualConfirmDialog(true);
                }}
                disabled={!onManualConfirmPayment || isManualConfirming}
              >
                <i className="bi bi-pencil-square mr-2"></i>
                Manual confirmation
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

    <Dialog open={showManualConfirmDialog} onOpenChange={setShowManualConfirmDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manual confirmation</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Confirm this booking without payment proof. Set how much the client paid (PHP). You can set 0 if you don’t require payment.
        </p>
        <div className="space-y-2">
          <Label htmlFor="manual-amount">Amount paid (PHP)</Label>
          <Input
            id="manual-amount"
            type="number"
            min={0}
            step={1}
            value={manualAmount}
            onChange={(e) => setManualAmount(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowManualConfirmDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={!onManualConfirmPayment || isManualConfirming}
            loading={isManualConfirming}
            onClick={async () => {
              if (!onManualConfirmPayment) return;
              await onManualConfirmPayment(manualAmount);
              setShowManualConfirmDialog(false);
            }}
          >
            {isManualConfirming ? 'Confirming...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
