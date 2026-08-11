'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export type CompletionPaymentMethod = 'PNB' | 'CASH' | 'GCASH';

export interface MarkCompletePayload {
  amountPaid: number;
  tipAmount: number;
  paymentMethod: CompletionPaymentMethod;
  receiptFile: File | null;
  nailFiles: File[];
}

interface MarkCompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balanceDue: number;
  onConfirm: (payload: MarkCompletePayload) => void;
  isLoading?: boolean;
}

const METHODS: { value: CompletionPaymentMethod; label: string }[] = [
  { value: 'PNB', label: 'PNB' },
  { value: 'GCASH', label: 'GCash' },
  { value: 'CASH', label: 'Cash' },
];

const MAX_NAIL_PHOTOS = 5;
const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/heic,image/heif';

export default function MarkCompleteModal({
  open,
  onOpenChange,
  balanceDue,
  onConfirm,
  isLoading = false,
}: MarkCompleteModalProps) {
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<CompletionPaymentMethod | ''>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [nailFiles, setNailFiles] = useState<File[]>([]);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [nailPreviews, setNailPreviews] = useState<string[]>([]);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const nailsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setAmountPaid(balanceDue > 0 ? String(balanceDue) : '0');
    setPaymentMethod('');
    setReceiptFile(null);
    setNailFiles([]);
    setReceiptPreview(null);
    setNailPreviews([]);
  }, [open, balanceDue]);

  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreview(null);
      return;
    }
    const url = URL.createObjectURL(receiptFile);
    setReceiptPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [receiptFile]);

  useEffect(() => {
    const urls = nailFiles.map((f) => URL.createObjectURL(f));
    setNailPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [nailFiles]);

  const paid = parseFloat(amountPaid) || 0;
  const tipAmount = Math.max(0, paid - balanceDue);
  const appliedToBalance = Math.min(paid, balanceDue);
  const needsReceipt = paymentMethod === 'PNB' || paymentMethod === 'GCASH';
  const canSubmit =
    !!paymentMethod &&
    nailFiles.length >= 1 &&
    nailFiles.length <= MAX_NAIL_PHOTOS &&
    (!needsReceipt || !!receiptFile) &&
    !isLoading;

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setReceiptFile(file);
  };

  const handleNailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setNailFiles((prev) => {
      const merged = [...prev, ...selected].slice(0, MAX_NAIL_PHOTOS);
      return merged;
    });
    e.target.value = '';
  };

  const removeNail = (index: number) => {
    setNailFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (!canSubmit || !paymentMethod) return;
    onConfirm({
      amountPaid: paid,
      tipAmount,
      paymentMethod,
      receiptFile: needsReceipt ? receiptFile : null,
      nailFiles,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(100%,36rem)] sm:max-w-xl flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Mark Complete</DialogTitle>
          <DialogDescription>
            Record payment method, attach receipt for digital payments, and upload finished nail photos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto min-h-0">
          <div className="rounded-xl bg-ash-soft p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining Balance:</span>
              <span className="font-semibold">PHP {balanceDue.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment method <span className="text-red-600">*</span></Label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setPaymentMethod(m.value);
                    if (m.value === 'CASH') setReceiptFile(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    paymentMethod === m.value
                      ? 'border-[#8a7864] bg-[#8a7864]/10 text-[#5c4f40]'
                      : 'border-border bg-background hover:bg-ash-soft'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {needsReceipt && (
            <div className="space-y-2">
              <Label htmlFor="completionReceipt">
                Payment receipt <span className="text-red-600">*</span>
              </Label>
              <input
                ref={receiptInputRef}
                id="completionReceipt"
                type="file"
                accept={ACCEPT_IMAGES}
                className="hidden"
                disabled={isLoading}
                onChange={handleReceiptChange}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => receiptInputRef.current?.click()}
                >
                  {receiptFile ? 'Change receipt' : 'Attach receipt'}
                </Button>
                {receiptFile && (
                  <span className="text-xs text-muted-foreground truncate max-w-[14rem]">
                    {receiptFile.name}
                  </span>
                )}
              </div>
              {receiptPreview && (
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="h-24 w-24 object-cover rounded-lg border border-border"
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="completionNails">
              Finished nail photos <span className="text-red-600">*</span>
              <span className="text-muted-foreground font-normal"> (1–{MAX_NAIL_PHOTOS})</span>
            </Label>
            <input
              ref={nailsInputRef}
              id="completionNails"
              type="file"
              accept={ACCEPT_IMAGES}
              multiple
              className="hidden"
              disabled={isLoading || nailFiles.length >= MAX_NAIL_PHOTOS}
              onChange={handleNailsChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading || nailFiles.length >= MAX_NAIL_PHOTOS}
              onClick={() => nailsInputRef.current?.click()}
            >
              Add nail photos
            </Button>
            {nailPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nailPreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={`Nail ${i + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => removeNail(i)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-ink text-white text-xs leading-none"
                      aria-label={`Remove nail photo ${i + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountPaid">Amount Paid</Label>
            <Input
              id="amountPaid"
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0"
              disabled={isLoading}
              className="w-full"
            />
          </div>
          {paid > 0 && (
            <div className="rounded-xl border border-border p-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Applied to balance:</span>
                <span>PHP {appliedToBalance.toLocaleString()}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Tip:</span>
                  <span>PHP {tipAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {isLoading ? 'Processing...' : 'Mark Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
