import React, { useState } from 'react';
import { Calendar, MapPin, Phone, AtSign, Sparkles, CreditCard, User, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge, { BookingStatus } from '../StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { ImageViewModal } from '@/components/ui/ImageViewModal';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { format } from 'date-fns';
import { sortTimesChronologically, formatTime12Hour } from '@/lib/utils';
import { getChosenServicesDisplay, getSlotServiceDisplay } from '@/lib/serviceLabels';
import { expressBrandedLineDescription, getExpressSegmentLabels } from '@/lib/utils/pricing';
import { isManiPediExpressDualFromParts } from '@/lib/utils/bookingInvoice';

function formatDateYyyyMmDd(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
}

/** Simultaneous two-tech Mani+Pedi is branded “Express” in admin UI */
function getBookingDetailsServiceDisplay(service: string | undefined, secondaryNailTechName?: string): string {
  const resolvedService = getSlotServiceDisplay(service);
  if (secondaryNailTechName?.trim() && resolvedService === 'Manicure + Pedicure') {
    return 'Mani+Pedi Express';
  }
  return getSlotServiceDisplay(service);
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
    serviceAddress?: string;
    invoice?: { quotationId?: string; total?: number; createdAt?: string } | null;
    secondaryInvoice?: { quotationId?: string; total?: number; createdAt?: string } | null;
    nailTechId?: string;
    nailTechName?: string;
    primaryNailTechId?: string;
    secondaryNailTechId?: string;
    secondaryNailTechName?: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    clientSocialMediaName?: string;
    service: string;
    secondaryServiceType?: string;
    /** From booking.service.mode — dual-tech detection when type is a display string */
    serviceMode?: 'single_tech' | 'simultaneous_two_techs';
    chosenServices?: string[];
    status: BookingStatus;
    notes?: string;
    adminNotes?: string;
    paymentStatus?: string;
    slotCount?: number;
    reservationAmount?: number;
    depositRequired?: number;
    paymentProofUrl?: string;
    amountPaid?: number;
    pricing?: { paidAmount?: number; tipAmount?: number; total?: number };
    completedAt?: string | null;
    clientPhotos?: {
      inspiration?: Array<{ url?: string }>;
      currentState?: Array<{ url?: string }>;
    };
    clientPhotoUploadUrl?: string | null;
    clientPhotoUploadExpiresAt?: string | null;
  } | null;
  onMarkComplete?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
  onChangeService?: () => void;
  onMarkNoShow?: () => void;
  onCreateInvoice?: (target?: 'primary' | 'secondary') => void;
  onVerifyPaymentProof?: () => void;
  isVerifyingPaymentProof?: boolean;
  onManualConfirmPayment?: (amountPaid: number) => Promise<void>;
  isManualConfirming?: boolean;
  onUpdatePayment?: (paidAmount: number, tipAmount: number) => Promise<void>;
  isUpdatingPayment?: boolean;
  onAdminNotesChange?: (value: string) => void;
  onSaveNotes?: () => void;
  adminNotesDraft?: string;
  onLinkGenerated?: (url: string, expiresAt: string) => void;
}

export default function BookingDetailsModal({
  show,
  onHide,
  booking,
  onMarkComplete,
  onCancel,
  onReschedule,
  onChangeService,
  onMarkNoShow,
  onCreateInvoice,
  onVerifyPaymentProof,
  isVerifyingPaymentProof = false,
  onManualConfirmPayment,
  isManualConfirming = false,
  onUpdatePayment,
  isUpdatingPayment = false,
  onAdminNotesChange,
  onSaveNotes,
  adminNotesDraft = '',
  onLinkGenerated,
}: BookingDetailsModalProps) {
  const [showManualConfirmDialog, setShowManualConfirmDialog] = useState(false);
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [showUpdatePaymentDialog, setShowUpdatePaymentDialog] = useState(false);
  const [updatePaidAmount, setUpdatePaidAmount] = useState<string>('0');
  const [updateTipAmount, setUpdateTipAmount] = useState<string>('0');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  if (!booking) return null;

  const resolvedService = getSlotServiceDisplay(booking.service);
  // Be tolerant of legacy stored service values so the modal consistently
  // switches to the "Express" single-tech display when a secondary tech exists.
  const isExpressManiPedi =
    Boolean(booking.secondaryNailTechName) &&
    resolvedService.toLowerCase().includes('manicure') &&
    resolvedService.toLowerCase().includes('pedicure');
  const expressTechRoleLabel = (() => {
    if (!isExpressManiPedi) return null;
    if (booking.nailTechId && booking.primaryNailTechId && booking.secondaryNailTechId) {
      if (String(booking.nailTechId) === String(booking.primaryNailTechId)) return 'Manicure';
      if (String(booking.nailTechId) === String(booking.secondaryNailTechId)) return 'Pedicure';
    }
    // Fallback: if the currently shown tech matches the secondary name, treat it as Pedicure.
    if (booking.nailTechName && booking.secondaryNailTechName && booking.nailTechName === booking.secondaryNailTechName) {
      return 'Pedicure';
    }
    return 'Manicure';
  })();

  const isManiPediExpressDual = isManiPediExpressDualFromParts(
    booking.service,
    booking.secondaryNailTechId,
    booking.serviceMode
  );
  const expressSeg = isManiPediExpressDual
    ? getExpressSegmentLabels(booking.secondaryServiceType)
    : null;

  const invoiceFooterActions =
    onCreateInvoice &&
    (isManiPediExpressDual && expressSeg ? (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap w-full">
        <Button
          type="button"
          variant="outline"
          className="flex-1 min-w-0"
          onClick={() => onCreateInvoice('primary')}
        >
          <i className="bi bi-receipt mr-2" />
          {booking.invoice?.quotationId ? 'Invoice' : 'Create invoice'} —{' '}
          {expressBrandedLineDescription(expressSeg.primary)}{' '}
          <span className="text-gray-500 font-normal">({booking.nailTechName ? `Ms. ${booking.nailTechName}` : 'Primary'})</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 min-w-0"
          onClick={() => onCreateInvoice('secondary')}
        >
          <i className="bi bi-receipt mr-2" />
          {booking.secondaryInvoice?.quotationId ? 'Invoice' : 'Create invoice'} —{' '}
          {expressBrandedLineDescription(expressSeg.secondary)}{' '}
          <span className="text-gray-500 font-normal">
            ({booking.secondaryNailTechName ? `Ms. ${booking.secondaryNailTechName}` : 'Secondary'})
          </span>
        </Button>
      </div>
    ) : (
      <Button type="button" variant="outline" onClick={() => onCreateInvoice()}>
        <i className="bi bi-receipt mr-2" />
        {booking.invoice?.quotationId ? 'View / Edit Invoice' : 'Create Invoice'}
      </Button>
    ));

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
      <DialogContent className="sm:max-w-2xl md:max-w-lg max-h-[85vh] flex flex-col overflow-hidden p-0">
        <VisuallyHidden.Root>
          <DialogTitle>Booking Details</DialogTitle>
        </VisuallyHidden.Root>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-10 pr-12 pb-3 space-y-3">
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
                  {expressTechRoleLabel ? (
                    <span>
                      Ms. {booking.nailTechName}
                      <span className="text-gray-400 text-[11px] ml-0.5">({expressTechRoleLabel})</span>
                    </span>
                  ) : booking.secondaryNailTechName ? (
                    <span>
                      Ms. {booking.nailTechName}
                      <span className="text-gray-400 text-[11px] ml-0.5">(Manicure)</span>
                      <span className="mx-1.5 text-gray-300">·</span>
                      Ms. {booking.secondaryNailTechName}
                      <span className="text-gray-400 text-[11px] ml-0.5">(Pedicure)</span>
                    </span>
                  ) : (
                    <span>Ms. {booking.nailTechName}</span>
                  )}
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
                <span>
                  {[getBookingDetailsServiceDisplay(booking.service, booking.secondaryNailTechName), getChosenServicesDisplay(booking.chosenServices)].filter(Boolean).join(' · ')}
                </span>
              </div>
              {locationLabel && (
                <div className="flex items-center gap-2">
                  <MapPin size={iconSize} className="text-gray-500 flex-shrink-0" strokeWidth={2} />
                  <span>{locationLabel}{booking.serviceAddress ? ` · ${booking.serviceAddress}` : ''}</span>
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
                  {paymentStatusLabel}
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
              <button
                type="button"
                onClick={() => setImagePreviewUrl(booking.paymentProofUrl!)}
                className="text-sm text-gray-600 hover:text-[#212529] bg-transparent border-none cursor-pointer p-0 underline hover:no-underline"
              >
                Open full image
              </button>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold mb-2 block">Client Photos</label>
            {booking.id && (
              <div className="mb-3">
                {(() => {
                  const hasValidLink = Boolean(
                    booking.clientPhotoUploadUrl &&
                    booking.clientPhotoUploadExpiresAt &&
                    new Date(booking.clientPhotoUploadExpiresAt) > new Date()
                  );
                  if (hasValidLink) {
                    return (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs text-gray-600 mb-2">Client upload link (valid until {format(new Date(booking.clientPhotoUploadExpiresAt!), 'MMM d, yyyy')})</p>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={booking.clientPhotoUploadUrl!}
                            className="text-sm font-mono"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(booking.clientPhotoUploadUrl!);
                                toast.success('Link copied to clipboard');
                              } catch {
                                toast.error('Failed to copy');
                              }
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!booking?.id) return;
                          setGeneratingLink(true);
                          try {
                            const res = await fetch(`/api/bookings/${booking.id}/generate-photo-upload-link`, { method: 'POST' });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Failed to generate link');
                            onLinkGenerated?.(data.url, data.expiresAt);
                            await navigator.clipboard.writeText(data.url);
                            toast.success('Upload link generated and copied. It will show here for easy resending.');
                          } catch (e: unknown) {
                            toast.error(e instanceof Error ? e.message : 'Failed to generate link');
                          } finally {
                            setGeneratingLink(false);
                          }
                        }}
                        disabled={generatingLink}
                      >
                        <Link2 size={14} className="mr-2" />
                        {generatingLink ? 'Generating...' : 'Generate upload link for client'}
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">Link valid 14 days. Client can upload inspo & current nails. Once generated, it stays here for resending.</p>
                    </>
                  );
                })()}
              </div>
            )}
          {((booking.clientPhotos?.currentState?.length ?? 0) > 0 || (booking.clientPhotos?.inspiration?.length ?? 0) > 0) && (
              <div className="space-y-3">
                {(booking.clientPhotos?.currentState?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Current nails</p>
                    <div className="flex flex-wrap gap-2">
                      {(booking.clientPhotos?.currentState ?? []).filter(p => p.url).map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImagePreviewUrl(p.url!)}
                          className="inline-block rounded-lg border border-gray-200 overflow-hidden hover:border-gray-400 transition-colors bg-transparent cursor-pointer p-0"
                        >
                          <img src={p.url!} alt={`Current nails ${i + 1}`} className="h-20 w-20 object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {(booking.clientPhotos?.inspiration?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Nail inspo</p>
                    <div className="flex flex-wrap gap-2">
                      {(booking.clientPhotos?.inspiration ?? []).filter(p => p.url).map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImagePreviewUrl(p.url!)}
                          className="inline-block rounded-lg border border-gray-200 overflow-hidden hover:border-gray-400 transition-colors bg-transparent cursor-pointer p-0"
                        >
                          <img src={p.url!} alt={`Nail inspo ${i + 1}`} className="h-20 w-20 object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
          )}
          </div>

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

        <DialogFooter className="flex-none shrink-0 flex-wrap gap-2 px-4 pb-4 pt-2 border-t border-[#e5e5e5] bg-[#f7f7f7] rounded-b-[24px]">
          {isPendingPayment ? (
            <>
              <Button
                variant="outline"
                onClick={onChangeService}
                disabled={!onChangeService}
              >
                <i className="bi bi-pencil-square mr-2"></i>Change service
              </Button>
              <Button
                variant="default"
                onClick={onVerifyPaymentProof}
                disabled={!canVerify || isVerifyingPaymentProof}
                loading={isVerifyingPaymentProof}
              >
                <i className="bi bi-shield-check mr-2"></i>
                {isVerifyingPaymentProof ? 'Verifying...' : 'Verify Payment'}
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
                Confirm Manually
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
            <>
              {invoiceFooterActions}
              <Button
                variant="outline"
                onClick={() => {
                  const paid = booking.pricing?.paidAmount ?? booking.amountPaid ?? 0;
                  const tip = booking.pricing?.tipAmount ?? 0;
                  setUpdatePaidAmount(String(paid));
                  setUpdateTipAmount(String(tip));
                  setShowUpdatePaymentDialog(true);
                }}
                disabled={!onUpdatePayment}
              >
                <i className="bi bi-currency-dollar mr-2"></i>
                Update Payment
              </Button>
            </>
          ) : (
            ['CONFIRMED', 'confirmed'].includes(booking.status) && (
              <>
                {invoiceFooterActions}
                <Button
                  variant="outline"
                  onClick={() => {
                    const paid = booking.pricing?.paidAmount ?? booking.amountPaid ?? 0;
                    const tip = booking.pricing?.tipAmount ?? 0;
                    setUpdatePaidAmount(String(paid));
                    setUpdateTipAmount(String(tip));
                    setShowUpdatePaymentDialog(true);
                  }}
                  disabled={!onUpdatePayment}
                >
                  <i className="bi bi-currency-dollar mr-2"></i>
                  Update Payment
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
                  onClick={onChangeService}
                  disabled={!onChangeService}
                >
                  <i className="bi bi-pencil-square mr-2"></i>Change service
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

    <ImageViewModal
      src={imagePreviewUrl ?? ''}
      alt="Image"
      open={!!imagePreviewUrl}
      onOpenChange={(open) => !open && setImagePreviewUrl(null)}
    />

    <Dialog open={showManualConfirmDialog} onOpenChange={setShowManualConfirmDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Manually</DialogTitle>
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

    <Dialog open={showUpdatePaymentDialog} onOpenChange={setShowUpdatePaymentDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Payment</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Update the amount paid and tip for this booking.
        </p>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="update-paid-amount">Amount paid (PHP)</Label>
            <Input
              id="update-paid-amount"
              type="number"
              min={0}
              step={1}
              value={updatePaidAmount}
              onChange={(e) => setUpdatePaidAmount(e.target.value)}
              placeholder="0"
              disabled={isUpdatingPayment}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="update-tip-amount">Tip amount (PHP)</Label>
            <Input
              id="update-tip-amount"
              type="number"
              min={0}
              step={1}
              value={updateTipAmount}
              onChange={(e) => setUpdateTipAmount(e.target.value)}
              placeholder="0"
              disabled={isUpdatingPayment}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowUpdatePaymentDialog(false)} disabled={isUpdatingPayment}>
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={!onUpdatePayment || isUpdatingPayment}
            loading={isUpdatingPayment}
            onClick={async () => {
              if (!onUpdatePayment) return;
              const paid = Math.max(0, Number(updatePaidAmount) || 0);
              const tip = Math.max(0, Number(updateTipAmount) || 0);
              await onUpdatePayment(paid, tip);
              setShowUpdatePaymentDialog(false);
            }}
          >
            {isUpdatingPayment ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
