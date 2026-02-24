'use client';

import { useState, useEffect } from 'react';
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

interface MarkCompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balanceDue: number;
  onConfirm: (amountPaid: number, tipAmount: number) => void;
  isLoading?: boolean;
}

export default function MarkCompleteModal({
  open,
  onOpenChange,
  balanceDue,
  onConfirm,
  isLoading = false,
}: MarkCompleteModalProps) {
  const [amountPaid, setAmountPaid] = useState<string>('');

  useEffect(() => {
    if (open) {
      setAmountPaid(balanceDue > 0 ? String(balanceDue) : '0');
    }
  }, [open, balanceDue]);

  const paid = parseFloat(amountPaid) || 0;
  const tipAmount = Math.max(0, paid - balanceDue);
  const appliedToBalance = Math.min(paid, balanceDue);

  const handleConfirm = () => {
    onConfirm(paid, tipAmount);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Complete</DialogTitle>
          <DialogDescription>
            Enter the amount received. Any amount over the balance due will be recorded as tip.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-xl bg-gray-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining Balance:</span>
              <span className="font-semibold">PHP {balanceDue.toLocaleString()}</span>
            </div>
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
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>
          {paid > 0 && (
            <div className="rounded-xl border border-gray-200 p-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
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
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Mark Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
