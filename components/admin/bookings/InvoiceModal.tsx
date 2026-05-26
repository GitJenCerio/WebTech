'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
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
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Trash2, ChevronDown, X, Download, Copy, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { formatTime12Hour, sortTimesChronologically } from '@/lib/utils';
import { getSlotServiceDisplay } from '@/lib/serviceLabels';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceModalBooking {
  bookingCode?: string;
  clientName: string;
  service: string;
  slotType?: 'regular' | 'with_squeeze_fee' | null;
  paidAmount?: number;
  date?: string;
  time?: string;
  slotTimes?: string[];
}

interface InvoiceModalProps {
  show: boolean;
  booking: InvoiceModalBooking | null;
  invoiceError: string | null;
  invoiceItems: InvoiceItem[];
  invoiceNotes: string;
  invoiceSaving: boolean;
  currentQuotationId: string | null;
  invoiceDiscountAmount: number;
  /** Suggested discount from nail tech (used when user unchecks "Remove discount") */
  suggestedDiscountAmount: number;
  /** Shown under the title for Mani + Pedi Express (which tech’s invoice). */
  invoiceSubtitle?: string | null;
  pricingData: any[];
  selectedPricingService: string;
  pricingLoading: boolean;
  pricingError: string | null;
  onClose: () => void;
  onSelectedPricingServiceChange: (value: string) => void;
  onInvoiceItemsChange: (items: InvoiceItem[]) => void;
  onInvoiceNotesChange: (value: string) => void;
  onInvoiceDiscountAmountChange: (amount: number) => void;
  onAddFromPricing: (serviceName?: string) => void;
  onSave: () => Promise<void>;
}

export default function InvoiceModal({
  show,
  booking,
  invoiceError,
  invoiceItems,
  invoiceNotes,
  invoiceSaving,
  currentQuotationId,
  invoiceDiscountAmount,
  suggestedDiscountAmount,
  invoiceSubtitle,
  pricingData,
  selectedPricingService,
  pricingLoading,
  pricingError,
  onClose,
  onSelectedPricingServiceChange,
  onInvoiceItemsChange,
  onInvoiceNotesChange,
  onInvoiceDiscountAmountChange,
  onAddFromPricing,
  onSave,
}: InvoiceModalProps) {
  const quotationRef = useRef<HTMLDivElement>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const serviceNames = useCallback(() => {
    return pricingData
      .map((item) => {
        const firstKey = Object.keys(item)[0];
        return String(item[firstKey] || '');
      })
      .filter((name) => name.trim());
  }, [pricingData]);

  const filteredServices = useCallback(() => {
    const names = serviceNames();
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return names;
    return names.filter((name) => name.toLowerCase().includes(q));
  }, [serviceNames, serviceSearch]);

  const handleSelectService = (name: string) => {
    onAddFromPricing(name);
    setServiceSearch('');
    setServiceDropdownOpen(false);
    onSelectedPricingServiceChange('');
  };

  useEffect(() => {
    if (!serviceDropdownOpen) setServiceSearch('');
  }, [serviceDropdownOpen]);

  if (!booking) return null;

  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const discountAmount = invoiceDiscountAmount;
  const squeeze = booking.slotType === 'with_squeeze_fee' ? 500 : 0;
  const total = subtotal - discountAmount + squeeze;
  const depositPaid = booking.paidAmount ?? 0;
  const balance = Math.max(0, total - depositPaid);

  const handleDownload = async () => {
    if (!quotationRef.current) return;
    const canvas = await html2canvas(quotationRef.current, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const padded = document.createElement('canvas');
    const pad = 48;
    padded.width = canvas.width + pad * 2;
    padded.height = canvas.height + pad * 2;
    const ctx = padded.getContext('2d')!;
    ctx.fillStyle = '#e8eaed';
    ctx.fillRect(0, 0, padded.width, padded.height);
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pad, pad, canvas.width, canvas.height);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.drawImage(canvas, pad, pad);

    const ts = new Date().toISOString().split('T')[0];
    const filename = `Invoice_${booking.clientName.replace(/\s+/g, '_')}_${ts}.jpg`;

    // On iOS, use Web Share API so the share sheet offers "Save Image" → Photos library
    const blob = await new Promise<Blob>((resolve, reject) =>
      padded.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/jpeg', 0.95)
    );
    const file = new File([blob], filename, { type: 'image/jpeg' });

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Try Web Share API — works on iOS Safari, iOS Chrome, Android Chrome
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // user cancelled
        // fall through to next option
      }
    }

    if (isMobile) {
      // Open image in new tab — user can long-press → "Save to Photos / Save Image"
      const url = URL.createObjectURL(blob);
      const newTab = window.open(url, '_blank');
      if (!newTab) {
        // popup blocked — fall back to download link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }

    // Desktop: direct file download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!quotationRef.current) return;
    const canvas = await html2canvas(quotationRef.current, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    const padded = document.createElement('canvas');
    const pad = 48;
    padded.width = canvas.width + pad * 2;
    padded.height = canvas.height + pad * 2;
    const ctx = padded.getContext('2d')!;

    // Light grey background so the white invoice card stands out
    ctx.fillStyle = '#e8eaed';
    ctx.fillRect(0, 0, padded.width, padded.height);

    // Drop shadow under the invoice card
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pad, pad, canvas.width, canvas.height);

    // Reset shadow before drawing invoice content
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.drawImage(canvas, pad, pad);

    // Clipboard API only accepts PNG
    const blob = await new Promise<Blob>((resolve, reject) =>
      padded.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
    );
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Copy not supported in this browser. Try the Save button instead.');
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl md:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{currentQuotationId ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
          {invoiceSubtitle ? (
            <p className="text-sm text-gray-600 font-normal pt-0.5">{invoiceSubtitle}</p>
          ) : null}
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-3 pr-1" style={{ fontSize: '0.92rem' }}>
          <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50">
            <div className="flex flex-col gap-2">
              {booking.bookingCode && (
                <div><strong>Booking Code:</strong> {booking.bookingCode}</div>
              )}
              <div><strong>Client:</strong> {booking.clientName}</div>
              <div><strong>Service:</strong> {getSlotServiceDisplay(booking.service)}</div>
            </div>
          </div>

          {invoiceError && (
            <Alert variant="destructive">
              <AlertDescription>{invoiceError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Label className="text-base font-semibold">Invoice Items</Label>
            <div className="space-y-2">
<div className="relative flex gap-2">
                <div className="relative w-full">
                  <Input
                    ref={searchInputRef}
                    value={serviceSearch}
                    onChange={(e) => {
                      setServiceSearch(e.target.value);
                      setServiceDropdownOpen(true);
                    }}
                    onFocus={() => setServiceDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setServiceDropdownOpen(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const filtered = filteredServices();
                        if (filtered.length >= 1) handleSelectService(filtered[0]);
                      }
                    }}
                    placeholder="Type to search service..."
                    disabled={pricingLoading || pricingError !== null}
                    className="pr-9"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  {serviceDropdownOpen && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1"
                    >
                      {filteredServices().length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No matching services</div>
                      ) : (
                        filteredServices().map((name, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectService(name);
                            }}
                          >
                            {name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              {pricingLoading && <div className="text-gray-500 text-sm">Loading pricing...</div>}
              {pricingError && <div className="text-red-600 text-sm">{pricingError}</div>}
            </div>

            <div className="space-y-3">
              {invoiceItems.length === 0 && (
                <p className="text-sm text-gray-500 py-2">No items yet. Select a service from the pricing list above or add items manually below.</p>
              )}
              {invoiceItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-12 md:col-span-4">
                    <Input
                      value={item.description}
                      placeholder="Description"
                      className="text-xs h-8 border-gray-400" style={{ backgroundColor: '#e5e7eb', backgroundImage: 'none' }}
                      onChange={(e) => {
                        const next = [...invoiceItems];
                        next[idx].description = e.target.value;
                        onInvoiceItemsChange(next);
                      }}
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      placeholder="Qty"
                      className="text-xs h-8 border-gray-400" style={{ backgroundColor: '#e5e7eb', backgroundImage: 'none' }}
                      onChange={(e) => {
                        const qty = Math.max(1, Number(e.target.value) || 1);
                        const next = [...invoiceItems];
                        next[idx].quantity = qty;
                        next[idx].total = qty * next[idx].unitPrice;
                        onInvoiceItemsChange(next);
                      }}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      placeholder="Unit Price"
                      className="text-xs h-8 border-gray-400" style={{ backgroundColor: '#e5e7eb', backgroundImage: 'none' }}
                      onChange={(e) => {
                        const price = Math.max(0, Number(e.target.value) || 0);
                        const next = [...invoiceItems];
                        next[idx].unitPrice = price;
                        next[idx].total = price * next[idx].quantity;
                        onInvoiceItemsChange(next);
                      }}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input value={item.total} disabled className="text-xs h-8 font-bold border-gray-400" style={{ backgroundColor: '#e5e7eb', backgroundImage: 'none', color: '#991b1b' }} />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => onInvoiceItemsChange(invoiceItems.filter((_, i) => i !== idx))}
                      className="flex items-center justify-center bg-transparent border-none cursor-pointer p-0"
                    >
                      <Trash2 className="h-5 w-5 text-black" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              className="bg-black hover:bg-gray-800 text-white"
              onClick={() => onInvoiceItemsChange([...invoiceItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }])}
            >
              <i className="bi bi-plus-circle mr-2"></i>Add Item
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Notes (optional)</Label>
            <Input
              value={invoiceNotes}
              onChange={(e) => onInvoiceNotesChange(e.target.value)}
            />
          </div>

          <div className="space-y-3 p-3 border border-gray-200 rounded-xl bg-gray-50">
            <Label className="text-base font-semibold">Discount</Label>
            <div className="flex items-center gap-3">
              <Checkbox
                id="remove-discount"
                checked={invoiceDiscountAmount === 0}
                onCheckedChange={(checked) => {
                  onInvoiceDiscountAmountChange(checked ? 0 : suggestedDiscountAmount);
                }}
              />
              <label htmlFor="remove-discount" className="text-sm font-medium cursor-pointer">
                Remove discount
              </label>
            </div>
            {invoiceDiscountAmount === 0 ? (
              <div className="flex items-center gap-2">
                <Label className="text-sm">Add discount (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value=""
                  onChange={(e) => {
                    const pct = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    const amt = subtotal > 0 ? Math.round(subtotal * (pct / 100)) : 0;
                    onInvoiceDiscountAmountChange(amt);
                  }}
                  className="w-24"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Label className="text-sm">Discount (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={subtotal > 0 ? Math.round((invoiceDiscountAmount / subtotal) * 100) : 0}
                  onChange={(e) => {
                    const pct = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    const amt = subtotal > 0 ? Math.round(subtotal * (pct / 100)) : 0;
                    onInvoiceDiscountAmountChange(amt);
                  }}
                  className="w-24"
                />
                <span className="text-xs text-gray-500">= PHP {invoiceDiscountAmount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div ref={quotationRef} className="px-6 pt-1 pb-6 border border-gray-200 rounded-2xl bg-white min-w-0 w-full" style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
              <div className="text-center mb-2 pb-3 border-b-2 border-[#212529]">
                <h5 className="mb-0 font-bold tracking-wider">INVOICE</h5>
              </div>
              <div className="mb-3 space-y-1">
                <div><strong>Client:</strong> {booking.clientName}</div>
                <div><strong>Date:</strong> {booking.date || new Date().toLocaleDateString('en-US')}</div>
                {(booking.slotTimes && booking.slotTimes.length > 0) || booking.time ? (
                  <div><strong>Time:</strong> <span className="whitespace-nowrap">{(booking.slotTimes && booking.slotTimes.length > 0)
                    ? sortTimesChronologically(booking.slotTimes).map(formatTime12Hour).join(' & ')
                    : formatTime12Hour(booking.time || '')}</span>
                  </div>
                ) : null}
              </div>
              <div className="mb-1 space-y-2">
                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between gap-8 items-start py-1">
                    <div className="min-w-0 flex-1">
                      <div className="break-words font-medium text-xs">{item.description}</div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">
                        PHP {(item.unitPrice || 0).toLocaleString()} x Qty. {item.quantity}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right tabular-nums whitespace-nowrap font-medium text-xs md:text-base">PHP {(item.total || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-1 border-t-2 border-[#212529] text-xs md:text-base">
                <div className="flex justify-between gap-8 font-semibold py-0.5">
                  <span className="min-w-0">Subtotal</span>
                  <span className="flex-shrink-0 text-right tabular-nums whitespace-nowrap">PHP {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-8 py-0.5">
                  <span className="min-w-0">Discount</span>
                  <span className="flex-shrink-0 text-right tabular-nums whitespace-nowrap">-PHP {discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-8 py-0.5">
                  <span className="min-w-0">Squeeze-in Fee</span>
                  <span className="flex-shrink-0 text-right tabular-nums whitespace-nowrap">PHP {squeeze.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-8 font-semibold pt-2 border-t border-[#212529]">
                  <span className="min-w-0">Total</span>
                  <span className="flex-shrink-0 text-right tabular-nums whitespace-nowrap">PHP {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-8 py-0.5">
                  <span className="min-w-0">Deposit Paid</span>
                  <span className="flex-shrink-0 text-right tabular-nums whitespace-nowrap">-PHP {depositPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-8 font-bold pt-2 border-t border-[#212529] text-base md:text-lg">
                  <span className="min-w-0">Balance Due</span>
                  <span className="flex-shrink-0 text-right tabular-nums whitespace-nowrap">PHP {balance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 shrink-0 border-t border-gray-100 pt-3 mt-2 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
          <Button type="button" variant="secondary" size="sm" className="shrink-0 px-2 bg-red-100 hover:bg-red-200 text-red-600 border-red-200" onClick={onClose} title="Close">
            <X className="h-4 w-4 text-red-600" />
          </Button>
          <Button type="button" variant="outline" size="sm" className="shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-600 border-blue-200" onClick={handleDownload} title="Save as Image">
            <Download className="h-4 w-4 text-blue-600 mr-1.5" />Save as Image
          </Button>
          <Button type="button" variant="outline" size="sm" className="shrink-0 bg-violet-100 hover:bg-violet-200 text-violet-600 border-violet-200" onClick={handleCopy} title="Copy Image">
            {copied ? <Check className="h-4 w-4 text-violet-600 mr-1.5" /> : <Copy className="h-4 w-4 text-violet-600 mr-1.5" />}
            {copied ? 'Copied!' : 'Copy Image'}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="flex-1"
            disabled={invoiceSaving}
            onClick={onSave}
            loading={invoiceSaving}
          >
            {invoiceSaving ? 'Saving...' : currentQuotationId ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
