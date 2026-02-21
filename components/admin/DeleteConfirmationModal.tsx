import React from 'react';
import { AlertCircle, Calendar, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface DeleteConfirmationModalProps {
  show: boolean;
  title?: string;
  message?: string;
  slotDate?: string;
  slotTime?: string;
  nailTechName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  show,
  title = 'Delete Slot',
  message = 'Are you sure you want to delete this slot? This action cannot be undone.',
  slotDate,
  slotTime,
  nailTechName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  // Format the date and time details
  const dateFormatted = slotDate ? new Date(slotDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) : '';

  const slotDetails = `${dateFormatted} at ${slotTime}${nailTechName ? ` - ${nailTechName}` : ''}`;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#212529]" />
            <DialogTitle className="text-lg font-semibold text-[#212529]">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4">
          <DialogDescription className="mb-3 text-gray-600 text-sm">
            {message}
          </DialogDescription>
          {slotDate && slotTime && (
            <div className="bg-gray-100 p-3 rounded-2xl border-l-4 border-[#212529] mt-4">
              <p className="text-sm font-medium text-[#212529] flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {slotDetails}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
