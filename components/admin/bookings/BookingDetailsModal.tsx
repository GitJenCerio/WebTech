import React, { useState, useRef } from 'react';
import { Calendar, MapPin, Phone, AtSign, Sparkles, CreditCard, User, Link2, Copy, Check } from 'lucide-react';
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
    /** Manicure tech display name (booking primary); set when opening from calendar so both techs resolve */
    primaryNailTechName?: string;
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
    serviceClientType?: 'new' | 'repeat';
    clientNailHistory?: {
      hasRussianManicure?: boolean;
      hasGelOverlay?: boolean;
      hasSoftgelExtensions?: boolean;
    };
    clientHealthInfo?: {
      allergies?: string;
      nailConcerns?: string;
      nailDamageHistory?: string;
    };
    clientInspoDescription?: string;
    clientTotalBookings?: number;
  } | null;
  onViewClient?: () => void;
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
  onViewClient,
  onAdminNotesChange,
  onSaveNotes,
  adminNotesDraft = '',
  onLinkGenerated,
}: BookingDetailsModalProps) {
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showManualConfirmDialog, setShowManualConfirmDialog] = useState(false);
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [showUpdatePaymentDialog, setShowUpdatePaymentDialog] = useState(false);
  const [updatePaidAmount, setUpdatePaidAmount] = useState<string>('0');
  const [updateTipAmount, setUpdateTipAmount] = useState<string>('0');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const bookingCardRef = useRef<HTMLDivElement>(null);

  if (!booking) return null;

  const isManiPediExpressDual = isManiPediExpressDualFromParts(
    booking.service,
    booking.secondaryNailTechId,
    booking.serviceMode
  );

  const manicureDisplayName =
    booking.primaryNailTechName ||
    (booking.primaryNailTechId && booking.nailTechId && String(booking.primaryNailTechId) === String(booking.nailTechId)
      ? booking.nailTechName
      : undefined);

  const pedicureDisplayName =
    booking.secondaryNailTechName ||
    (booking.secondaryNailTechId && booking.nailTechId && String(booking.secondaryNailTechId) === String(booking.nailTechId)
      ? booking.nailTechName
      : undefined);

  const expressSeg = isManiPediExpressDual
    ? getExpressSegmentLabels(booking.secondaryServiceType)
    : null;

  const invoiceFooterActions =
    onCreateInvoice &&
    (isManiPediExpressDual && expressSeg ? (
      <div className="flex flex-col gap-2 w-full max-w-full">
        <Button
          type="button"
          variant="outline"
          className="flex-1 min-w-0 h-auto min-h-10 items-start justify-start gap-2 whitespace-normal py-3 px-3 text-left text-sm leading-snug bg-gray-700 hover:bg-gray-800 text-white border-gray-700"
          onClick={() => onCreateInvoice('primary')}
        >
          <i className="bi bi-receipt shrink-0 mt-0.5 text-base leading-none" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">
              {booking.invoice?.quotationId ? 'View / edit invoice' : 'Create invoice'}
              <span className="text-gray-300 font-normal">
                {' '}
                — {expressBrandedLineDescription(expressSeg.primary)}
              </span>
            </span>
            <span className="mt-1 block text-xs font-normal text-gray-400">
              {manicureDisplayName ? `Ms. ${manicureDisplayName}` : 'Primary tech'}
            </span>
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 min-w-0 h-auto min-h-10 items-start justify-start gap-2 whitespace-normal py-3 px-3 text-left text-sm leading-snug bg-gray-700 hover:bg-gray-800 text-white border-gray-700"
          onClick={() => onCreateInvoice('secondary')}
        >
          <i className="bi bi-receipt shrink-0 mt-0.5 text-base leading-none" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">
              {booking.secondaryInvoice?.quotationId ? 'View / edit invoice' : 'Create invoice'}
              <span className="text-gray-300 font-normal">
                {' '}
                — {expressBrandedLineDescription(expressSeg.secondary)}
              </span>
            </span>
            <span className="mt-1 block text-xs font-normal text-gray-400">
              {pedicureDisplayName ? `Ms. ${pedicureDisplayName}` : 'Secondary tech'}
            </span>
          </span>
        </Button>
      </div>
    ) : (
      <Button type="button" variant="outline" className="w-full bg-gray-700 hover:bg-gray-800 text-white border-gray-700" onClick={() => onCreateInvoice()}>
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
  const timeStr = (() => {
    const raw =
      booking.slotTimes && booking.slotTimes.length > 0
        ? sortTimesChronologically(booking.slotTimes).filter(Boolean)
        : [booking.time].filter(Boolean);
    const unique = [...new Set(raw)];
    return unique.map(formatTime12Hour).join(' & ');
  })();
  const formattedDate = formatDateYyyyMmDd(booking.date);
  const dateTimeStr = `${formattedDate} · ${timeStr}`;
  const locationLabel = booking.serviceLocation === 'home_service' ? 'Home Service' : booking.serviceLocation === 'homebased_studio' ? 'Homebased Studio' : '';
  const isConfirmed = ['CONFIRMED', 'confirmed'].includes(booking.status);
  const isCompletedStatus = ['COMPLETED', 'completed'].includes(booking.status);

  const handleCopy = async () => {
    if (!bookingCardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = bookingCardRef.current;
      const prevBorder = el.style.border;
      const prevBoxShadow = el.style.boxShadow;
      el.style.border = 'none';
      el.style.boxShadow = 'none';
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (_clonedDoc, clonedEl) => {
          clonedEl.style.border = 'none';
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.outline = 'none';
          clonedEl.querySelectorAll<HTMLElement>('*').forEach((el) => {
            const cl = el.classList;
            if (cl.contains('flex')) el.style.display = 'flex';
            if (cl.contains('inline-flex')) el.style.display = 'inline-flex';
            if (cl.contains('flex-col')) el.style.flexDirection = 'column';
            if (cl.contains('flex-wrap')) el.style.flexWrap = 'wrap';
            if (cl.contains('items-center')) el.style.alignItems = 'center';
            if (cl.contains('items-start')) el.style.alignItems = 'flex-start';
            if (cl.contains('justify-between')) el.style.justifyContent = 'space-between';
            if (cl.contains('justify-center')) el.style.justifyContent = 'center';
            if (cl.contains('gap-1')) el.style.gap = '4px';
            if (cl.contains('gap-2')) el.style.gap = '8px';
            if (cl.contains('gap-3')) el.style.gap = '12px';
            if (cl.contains('flex-shrink-0') || cl.contains('shrink-0')) el.style.flexShrink = '0';
            if (cl.contains('flex-1')) el.style.flex = '1 1 0%';
            if (cl.contains('min-w-0')) el.style.minWidth = '0';
          });
          clonedEl.querySelectorAll('svg').forEach((svg) => {
            const s = svg as SVGElement;
            s.style.display = 'block';
            s.style.flexShrink = '0';
            s.style.alignSelf = 'center';
          });
        },
      });
      el.style.border = prevBorder;
      el.style.boxShadow = prevBoxShadow;
      const pad = 48;
      const padded = document.createElement('canvas');
      padded.width = canvas.width + pad * 2;
      padded.height = canvas.height + pad * 2;
      const ctx = padded.getContext('2d')!;
      ctx.fillStyle = '#e8eaed';
      ctx.fillRect(0, 0, padded.width, padded.height);
      ctx.shadowColor = 'rgba(0,0,0,0.22)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pad, pad, canvas.width, canvas.height);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.drawImage(canvas, pad, pad);
      const blob = await new Promise<Blob>((resolve, reject) =>
        padded.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))), 'image/png')
      );
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not supported
    }
  };

  const getStatusBadge = () => {
    const label = booking.status === 'CONFIRMED' || booking.status === 'confirmed' ? 'CONFIRMED'
      : booking.status === 'COMPLETED' || booking.status === 'completed' ? 'COMPLETED'
      : booking.status === 'PENDING_PAYMENT' || booking.status === 'pending' || booking.status === 'booked' ? 'PENDING'
      : String(booking.status).toUpperCase().replace(/-/g, ' ');
    if (isConfirmed) {
      return <span className="inline-block px-2 pt-[2px] pb-[8px] leading-none rounded-lg text-[9px] font-semibold uppercase tracking-wide text-white bg-emerald-600">CONFIRMED</span>;
    }
    if (isCompletedStatus) {
      return <span className="inline-block px-2 pt-[2px] pb-[8px] leading-none rounded-lg text-[9px] font-semibold uppercase tracking-wide text-white bg-gray-700">COMPLETED</span>;
    }
    return <StatusBadge status={booking.status} className="!inline-block !leading-none !pt-[2px] !pb-[4px] !py-0" />;
  };

  return (
    <>
    <Dialog open={show} onOpenChange={(open) => { if (!open) { setShowMoreActions(false); onHide(); } }}>
      <DialogContent className="sm:max-w-2xl md:max-w-lg max-h-[85vh] flex flex-col overflow-hidden p-0">
        <VisuallyHidden.Root>
          <DialogTitle>Booking Details</DialogTitle>
        </VisuallyHidden.Root>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-10 pr-12 pb-3 space-y-3">
          <div ref={bookingCardRef} className="p-3 rounded-2xl bg-white border border-[#e5e5e5] shadow-sm relative sm:p-3">
            <div className="flex justify-between items-start gap-3 mb-2">
              <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-gray-500">BOOKING</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {booking.slotType === 'with_squeeze_fee' && (
                  <span className={`inline-block px-2 pt-[2px] pb-[8px] leading-none rounded-full text-[9px] font-semibold ${
                    booking.serviceLocation === 'home_service'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>SQ</span>
                )}
                {booking.serviceClientType && (
                  <span className={`inline-block px-2 pt-[2px] pb-[8px] leading-none rounded-full text-[9px] font-semibold ${
                    booking.serviceClientType === 'new'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-blue-100 text-blue-700 border border-blue-300'
                  }`}>
                    {booking.serviceClientType === 'new' ? 'New' : 'Repeat'}
                  </span>
                )}
                {getStatusBadge()}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Copy booking details as image"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-[#1a1a1a]">{booking.clientName}</h3>
            {(booking.bookingCode || onViewClient) && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {booking.bookingCode && (
                  <span className="text-[11px] sm:text-xs text-gray-500">{booking.bookingCode}</span>
                )}
                {onViewClient && (
                  <button
                    type="button"
                    onClick={onViewClient}
                    title="View Client Profile"
                    className="inline-flex items-center justify-center text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                  >
                    <i className="bi bi-person-lines-fill text-sm"></i>
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-col gap-1.5 mt-3 text-xs sm:text-sm text-[#1a1a1a]">
              <div className="flex items-center gap-2">
                <Calendar size={iconSize} className="text-gray-500 flex-shrink-0" strokeWidth={2} />
                <span>{formattedDate} · <span className="whitespace-nowrap">{timeStr}</span></span>
              </div>
              {(isManiPediExpressDual && (manicureDisplayName || pedicureDisplayName)) ? (
                <div className="flex flex-col gap-2">
                  {manicureDisplayName && (
                    <div className="flex items-start gap-2">
                      <User size={iconSize} className="text-gray-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span>
                        Ms. {manicureDisplayName}
                        <span className="text-gray-400 text-[11px] ml-1">(Manicure)</span>
                      </span>
                    </div>
                  )}
                  {pedicureDisplayName && (
                    <div className="flex items-start gap-2">
                      <User size={iconSize} className="text-gray-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span>
                        Ms. {pedicureDisplayName}
                        <span className="text-gray-400 text-[11px] ml-1">(Pedicure)</span>
                      </span>
                    </div>
                  )}
                </div>
              ) : booking.nailTechName ? (
                <div className="flex items-center gap-2">
                  <User size={iconSize} className="text-gray-500 flex-shrink-0" strokeWidth={2} />
                  <span>Ms. {booking.nailTechName}</span>
                </div>
              ) : null}
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
                    className={`inline-block px-2 pt-[2px] pb-[8px] leading-none rounded-lg text-[11px] sm:text-xs font-medium ${
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

        <DialogFooter className="flex-none shrink-0 flex flex-col gap-3 w-full max-w-full px-4 pb-12 pt-2 border-t border-[#e5e5e5] bg-[#f7f7f7] rounded-b-[24px] sm:flex-row sm:flex-wrap sm:items-start" style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom, 3rem))' }}>
          {isPendingPayment ? (
            <div className="flex flex-col gap-2 w-full">
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="default"
                  onClick={onVerifyPaymentProof}
                  disabled={!canVerify || isVerifyingPaymentProof}
                  loading={isVerifyingPaymentProof}
                  className="w-full whitespace-normal h-auto py-2 text-xs sm:text-sm"
                >
                  <i className="bi bi-shield-check mr-1.5"></i>
                  {isVerifyingPaymentProof ? 'Verifying...' : 'Verify Payment'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setManualAmount(booking.reservationAmount ?? 0);
                    setShowManualConfirmDialog(true);
                  }}
                  disabled={!onManualConfirmPayment || isManualConfirming}
                  className="w-full whitespace-normal h-auto py-2 text-xs sm:text-sm"
                >
                  <i className="bi bi-pencil-square mr-1.5"></i>
                  Confirm Manually
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={onChangeService}
                  disabled={!onChangeService}
                  className="w-full whitespace-normal h-auto py-2 text-xs sm:text-sm"
                >
                  <i className="bi bi-pencil-square mr-1.5"></i>Modify
                </Button>
                <Button
                  variant="destructive"
                  onClick={onCancel}
                  disabled={!onCancel}
                  className="w-full whitespace-normal h-auto py-2 text-xs sm:text-sm"
                >
                  <i className="bi bi-x-circle mr-1.5"></i>Cancel
                </Button>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="flex w-full max-w-full flex-col gap-3">
              {invoiceFooterActions}
              <Button
                variant="outline"
                className="w-full"
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
            </div>
          ) : (
            ['CONFIRMED', 'confirmed'].includes(booking.status) && (
              <div className="flex w-full max-w-full flex-col gap-2 sm:flex-1 sm:min-w-0">
                <button
                  type="button"
                  onClick={() => setShowMoreActions((v) => !v)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {showMoreActions ? <><i className="bi bi-chevron-up text-[11px]"></i>Hide options</> : <><i className="bi bi-chevron-down text-[11px]"></i>More options</>}
                </button>
                {showMoreActions && (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button
                      variant="outline"
                      className="shrink-0"
                      onClick={() => {
                        const paid = booking.pricing?.paidAmount ?? booking.amountPaid ?? 0;
                        const tip = booking.pricing?.tipAmount ?? 0;
                        setUpdatePaidAmount(String(paid));
                        setUpdateTipAmount(String(tip));
                        setShowUpdatePaymentDialog(true);
                      }}
                      disabled={!onUpdatePayment}
                    >
                      <i className="bi bi-currency-dollar mr-2"></i>Payment
                    </Button>
                    <Button variant="outline" className="shrink-0" onClick={onReschedule} disabled={!onReschedule}>
                      <i className="bi bi-calendar-event mr-2"></i>Resched
                    </Button>
                    <Button variant="outline" className="shrink-0" onClick={onChangeService} disabled={!onChangeService}>
                      <i className="bi bi-pencil-square mr-2"></i>Modify
                    </Button>
                    <Button variant="outline" className="shrink-0" onClick={onMarkNoShow} disabled={!onMarkNoShow}>
                      <i className="bi bi-person-x mr-2"></i>No Show
                    </Button>
                  </div>
                )}
                {isManiPediExpressDual && expressSeg ? (
                  <>
                    {invoiceFooterActions}
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <Button variant="default" className="shrink-0 bg-green-600 hover:bg-green-700" onClick={onMarkComplete} disabled={!onMarkComplete}>
                        <i className="bi bi-check-circle mr-2"></i>Complete
                      </Button>
                      <Button variant="destructive" className="shrink-0" onClick={onCancel} disabled={!onCancel}>
                        <i className="bi bi-x-circle mr-2"></i>Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {onCreateInvoice && (
                      <Button type="button" variant="outline" className="bg-gray-700 hover:bg-gray-800 text-white border-gray-700 w-full" onClick={() => onCreateInvoice()}>
                        <i className="bi bi-receipt mr-1.5" />Invoice
                      </Button>
                    )}
                    <Button variant="default" className="bg-green-600 hover:bg-green-700 w-full" onClick={onMarkComplete} disabled={!onMarkComplete}>
                      <i className="bi bi-check-circle mr-1.5"></i>Complete
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={onCancel} disabled={!onCancel}>
                      <i className="bi bi-x-circle mr-1.5"></i>Cancel
                    </Button>
                  </div>
                )}
              </div>
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
