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
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { getRequiredSlotCountForService } from '@/lib/serviceSlotCount';
import { mapServiceToStandardDisplay, CHOSEN_SERVICE_LABELS } from '@/lib/serviceLabels';
import type { ServiceType } from '@/lib/types';

const CHOSEN_SERVICE_OPTIONS = Object.entries(CHOSEN_SERVICE_LABELS).map(([value, label]) => ({ value, label }));

const SERVICE_TYPES: ServiceType[] = [
  'Manicure',
  'Pedicure',
  'Manicure + Pedicure',
  'Mani + Pedi Express',
  'Manicure for 2',
  'Pedicure for 2',
  'Manicure for 2 or more',
  'Pedicure for 2 or more',
  'Manicure + Pedicure for 1',
  'Manicure + Pedicure for 2',
  'Manicure + Pedicure for 2 or more',
];

interface ChangeServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentService?: string;
  currentServiceLocation?: 'homebased_studio' | 'home_service';
  currentChosenServices?: string[];
  currentSlotCount?: number;
  onConfirm: (service: { type: string; location?: string; chosenServices?: string[] }) => Promise<void>;
  isLoading?: boolean;
}

export default function ChangeServiceModal({
  open,
  onOpenChange,
  currentService,
  currentServiceLocation = 'homebased_studio',
  currentChosenServices = [],
  currentSlotCount = 1,
  onConfirm,
  isLoading = false,
}: ChangeServiceModalProps) {
  const [selectedServiceType, setSelectedServiceType] = useState<string>(mapServiceToStandardDisplay(currentService));
  const [chosenServices, setChosenServices] = useState<string[]>(currentChosenServices);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedServiceType(mapServiceToStandardDisplay(currentService));
      setChosenServices(Array.isArray(currentChosenServices) ? currentChosenServices : []);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- currentChosenServices excluded to avoid infinite loop (array ref changes every render)
  }, [open, currentService]);

  const requiredSlots = getRequiredSlotCountForService(selectedServiceType, currentServiceLocation);
  const canChange = requiredSlots <= currentSlotCount;

  const handleConfirm = async () => {
    if (!canChange) return;
    setError(null);
    try {
      await onConfirm({
        type: selectedServiceType,
        location: currentServiceLocation,
        chosenServices: chosenServices.length > 0 ? chosenServices : undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change service</DialogTitle>
          <DialogDescription>
            Change the service type for this booking. Current booking has {currentSlotCount} slot(s).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-xs text-gray-500">Service type *</Label>
            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
              <SelectTrigger className="h-9 mt-1">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s} {getRequiredSlotCountForService(s, currentServiceLocation) > 1 ? `(${getRequiredSlotCountForService(s, currentServiceLocation)} slots)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!canChange && (
              <p className="text-xs text-amber-600 mt-1">
                This service requires {requiredSlots} slot(s). Use Reschedule to select more slots.
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs text-gray-500">Specific / Add-ons</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CHOSEN_SERVICE_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e5e5e5] bg-white cursor-pointer hover:border-[#1a1a1a]/30 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={chosenServices.includes(value)}
                    onChange={() => {
                      setChosenServices((prev) =>
                        prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
                      );
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-[#1a1a1a]">{label}</span>
                </label>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canChange || isLoading}
            loading={isLoading}
          >
            Update service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
