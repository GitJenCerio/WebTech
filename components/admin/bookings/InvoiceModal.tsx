import { useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Trash2 } from 'lucide-react';

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
  pricingData: any[];
  selectedPricingService: string;
  pricingLoading: boolean;
  pricingError: string | null;
  onClose: () => void;
  onSelectedPricingServiceChange: (value: string) => void;
  onInvoiceItemsChange: (items: InvoiceItem[]) => void;
  onInvoiceNotesChange: (value: string) => void;
  onAddFromPricing: () => void;
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
  pricingData,
  selectedPricingService,
  pricingLoading,
  pricingError,
  onClose,
  onSelectedPricingServiceChange,
  onInvoiceItemsChange,
  onInvoiceNotesChange,
  onAddFromPricing,
  onSave,
}: InvoiceModalProps) {
  const quotationRef = useRef<HTMLDivElement>(null);

  if (!booking) return null;

  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const discountAmount = invoiceDiscountAmount;
  const squeeze = booking.slotType === 'with_squeeze_fee' ? 500 : 0;
  const total = subtotal - discountAmount + squeeze;
  const depositPaid = booking.paidAmount ?? 0;
  const balance = Math.max(0, total - depositPaid);

  const handleDownload = async () => {
    if (!quotationRef.current) return;
    const canvas = await html2canvas(quotationRef.current, { scale: 2, backgroundColor: '#ffffff' });
    const imageData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const ts = new Date().toISOString().split('T')[0];
    link.href = imageData;
    link.download = `Quotation_${booking.clientName.replace(/\s+/g, '_')}_${ts}.png`;
    link.click();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-3" style={{ fontSize: '0.92rem' }}>
          <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50">
            <div className="flex flex-col gap-2">
              {booking.bookingCode && (
                <div><strong>Booking Code:</strong> {booking.bookingCode}</div>
              )}
              <div><strong>Client:</strong> {booking.clientName}</div>
              <div><strong>Service:</strong> {booking.service}</div>
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
              <Label className="text-sm">Add from Pricing</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedPricingService}
                  onValueChange={onSelectedPricingServiceChange}
                  disabled={pricingLoading || pricingError !== null}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pricingData.map((item, idx) => {
                      const firstKey = Object.keys(item)[0];
                      const name = String(item[firstKey] || '');
                      return name ? (
                        <SelectItem key={idx} value={name}>{name}</SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onAddFromPricing}
                  disabled={!selectedPricingService}
                >
                  Add
                </Button>
              </div>
              {pricingLoading && <div className="text-gray-500 text-sm">Loading pricing...</div>}
              {pricingError && <div className="text-red-600 text-sm">{pricingError}</div>}
            </div>

            <div className="space-y-3">
              {invoiceItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 md:col-span-5">
                    <Label className="text-xs mb-1">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => {
                        const next = [...invoiceItems];
                        next[idx].description = e.target.value;
                        onInvoiceItemsChange(next);
                      }}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <Label className="text-xs mb-1">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = Math.max(1, Number(e.target.value) || 1);
                        const next = [...invoiceItems];
                        next[idx].quantity = qty;
                        next[idx].total = qty * next[idx].unitPrice;
                        onInvoiceItemsChange(next);
                      }}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <Label className="text-xs mb-1">Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const price = Math.max(0, Number(e.target.value) || 0);
                        const next = [...invoiceItems];
                        next[idx].unitPrice = price;
                        next[idx].total = price * next[idx].quantity;
                        onInvoiceItemsChange(next);
                      }}
                    />
                  </div>
                  <div className="col-span-10 md:col-span-2">
                    <Label className="text-xs mb-1">Total</Label>
                    <Input value={item.total} disabled />
                  </div>
                  <div className="col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (invoiceItems.length === 1) return;
                        onInvoiceItemsChange(invoiceItems.filter((_, i) => i !== idx));
                      }}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
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

          <div className="text-right space-y-1 font-semibold">
            <div>Subtotal: PHP {subtotal.toLocaleString()}</div>
            <div>Discount: -PHP {discountAmount.toLocaleString()}</div>
            <div>Squeeze-in Fee: PHP {squeeze.toLocaleString()}</div>
            <div>Total: PHP {total.toLocaleString()}</div>
            <div>Deposit Paid: -PHP {depositPaid.toLocaleString()}</div>
            <div>Balance Due: PHP {balance.toLocaleString()}</div>
          </div>

          <div className="mt-4">
            <div ref={quotationRef} className="p-4 border border-gray-200 rounded-2xl bg-white" style={{ maxWidth: '680px', margin: '0 auto' }}>
              <div className="text-center mb-3 pb-2 border-b-2 border-[#212529]">
                <h5 className="mb-1 font-bold tracking-wider">QUOTATION</h5>
              </div>
              <div className="mb-3 space-y-1">
                <div><strong>Client:</strong> {booking.clientName}</div>
                <div><strong>Date:</strong> {new Date().toLocaleDateString('en-US')}</div>
              </div>
              <div className="mb-3 space-y-1">
                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>{item.description} x {item.quantity}</div>
                    <div>PHP {(item.total || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1 pt-2 border-t-2 border-[#212529]">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>PHP {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-PHP {discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Squeeze-in Fee</span>
                  <span>PHP {squeeze.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-[#212529]">
                  <span>Total</span>
                  <span>PHP {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="outline" onClick={handleDownload}>
            Download
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={invoiceSaving}
            onClick={onSave}
            loading={invoiceSaving}
          >
            {invoiceSaving ? 'Saving...' : currentQuotationId ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
