import React, { useState, useEffect } from 'react';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { BookingStatus } from '../StatusBadge';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert, AlertDescription } from '@/components/ui/Alert';

export type SlotType = 'regular' | 'with_squeeze_fee';

interface EditSlotModalProps {
  show: boolean;
  onHide: () => void;
  onUpdate: (slotId: string, updates: {
    status?: BookingStatus;
    slotType?: SlotType;
    notes?: string;
    isHidden?: boolean;
  }) => Promise<void>;
  onDelete: (slotId: string) => Promise<void>;
  slot?: {
    id: string;
    date: string;
    time: string;
    status: BookingStatus;
    type?: SlotType;
    nailTechId?: string;
    nailTechName?: string;
    notes?: string;
    isHidden?: boolean;
  };
  isLoading?: boolean;
  error?: string | null;
}

export default function EditSlotModal({
  show,
  onHide,
  onUpdate,
  onDelete,
  slot,
  isLoading = false,
  error: externalError = null,
}: EditSlotModalProps) {
  const [slotType, setSlotType] = useState<SlotType>('regular');
  const [notes, setNotes] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (slot) {
      setSlotType(slot.type || 'regular');
      setNotes(slot.notes || '');
      setIsHidden(slot.isHidden || false);
      setError(null);
    }
  }, [slot, show]);

  if (!slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onUpdate(slot.id, {
        slotType,
        notes,
        isHidden,
      });
      onHide();
    } catch (err: any) {
      setError(err.message || 'Failed to update slot');
    }
  };

  const handleRequestDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await onDelete(slot.id);
      setShowDeleteConfirm(false);
      onHide();
    } catch (err: any) {
      setError(err.message || 'Failed to delete slot');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Slot: {slot.time} on {slot.date}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            {/* Nail Tech Info */}
            <div className="space-y-1.5">
              <Label>Nail Technician</Label>
              <div className="px-4 py-2 bg-gray-100 rounded-2xl text-sm">
                {slot.nailTechName || 'Unknown'}
              </div>
              <small className="text-gray-500 text-xs block">
                Cannot be changed for existing slots
              </small>
            </div>

            {/* Slot Type */}
            <div className="space-y-1.5">
              <Label htmlFor="slotType">Slot Type</Label>
              <Select
                value={slotType}
                onValueChange={(value) => setSlotType(value as SlotType)}
                disabled={isLoading}
              >
                <SelectTrigger id="slotType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="with_squeeze_fee">With Squeeze Fee (₱500)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this slot..."
                disabled={isLoading}
              />
            </div>

            {/* Hidden from Clients */}
            <div className="flex items-start space-x-3 space-y-0">
              <Checkbox
                id="isHidden"
                checked={isHidden}
                onCheckedChange={(checked) => setIsHidden(checked === true)}
                disabled={isLoading}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="isHidden" className="cursor-pointer">
                  Hide from clients during booking
                </Label>
                <small className="text-gray-500 text-xs block">
                  Hidden slots won't appear in the public booking calendar
                </small>
              </div>
            </div>

            {/* Error Message */}
            {(error || externalError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || externalError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRequestDelete}
              disabled={isLoading || isDeleting}
              className="mr-auto"
            >
              {isDeleting ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onHide}
              disabled={isLoading || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isLoading || isDeleting}
              loading={isLoading}
            >
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title="Delete slot"
      description="Are you sure you want to delete this slot?"
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={() => handleConfirmDelete()}
      isLoading={isDeleting}
    />
    </>
  );
}
