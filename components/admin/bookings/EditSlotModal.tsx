import React, { useState, useEffect, useMemo } from 'react';
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
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { formatTime12Hour } from '@/lib/utils';
import { normalizeSlotTime } from '@/lib/constants/slots';

export type SlotType = 'regular' | 'with_squeeze_fee';
type EditableSlotStatus = 'available' | 'blocked';

interface NailTech {
  id: string;
  name: string;
}

const TIME_OPTIONS: string[] = (() => {
  const times: string[] = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return times;
})();

function toEditableStatus(status?: BookingStatus): EditableSlotStatus {
  if (status === 'blocked' || status === 'disabled') return 'blocked';
  return 'available';
}

interface EditSlotModalProps {
  show: boolean;
  onHide: () => void;
  onUpdate: (slotId: string, updates: {
    date?: string;
    time?: string;
    status?: BookingStatus;
    slotType?: SlotType;
    notes?: string;
    isHidden?: boolean;
    nailTechId?: string;
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
  nailTechs?: NailTech[];
  isLoading?: boolean;
  error?: string | null;
}

export default function EditSlotModal({
  show,
  onHide,
  onUpdate,
  onDelete,
  slot,
  nailTechs = [],
  isLoading = false,
  error: externalError = null,
}: EditSlotModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<EditableSlotStatus>('available');
  const [slotType, setSlotType] = useState<SlotType>('regular');
  const [notes, setNotes] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [nailTechId, setNailTechId] = useState('');
  const [occupiedTimes, setOccupiedTimes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (slot) {
      setDate(slot.date);
      setTime(normalizeSlotTime(slot.time));
      setStatus(toEditableStatus(slot.status));
      setSlotType(slot.type || 'regular');
      setNotes(slot.notes || '');
      setIsHidden(slot.isHidden || false);
      setNailTechId(slot.nailTechId || '');
      setError(null);
    }
  }, [slot, show]);

  useEffect(() => {
    if (!show || !date || !nailTechId || !slot?.id) {
      setOccupiedTimes(new Set());
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ date, nailTechId });
        const response = await fetch(`/api/slots?${params}`);
        if (!response.ok || cancelled) return;
        const data = await response.json();
        const taken = new Set<string>(
          (data.slots || [])
            .filter((s: { id?: string; _id?: string }) => String(s.id || s._id) !== slot.id)
            .map((s: { time?: string }) => normalizeSlotTime(s.time || ''))
            .filter(Boolean)
        );
        if (!cancelled) setOccupiedTimes(taken);
      } catch {
        if (!cancelled) setOccupiedTimes(new Set());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [show, date, nailTechId, slot?.id]);

  const timeOptions = useMemo(() => {
    if (time && !TIME_OPTIONS.includes(time)) {
      return [...TIME_OPTIONS, time].sort();
    }
    return TIME_OPTIONS;
  }, [time]);

  const isTimeTaken = Boolean(time && occupiedTimes.has(time));
  const canChangeNailTech = nailTechs.length > 1;

  if (!slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('Please select a date');
      return;
    }
    if (!time) {
      setError('Please select a time');
      return;
    }
    if (isTimeTaken) {
      setError('A slot already exists at this date and time for this nail tech');
      return;
    }
    if (!nailTechId) {
      setError('Please select a nail technician');
      return;
    }

    try {
      await onUpdate(slot.id, {
        date,
        time,
        status,
        slotType,
        notes,
        isHidden,
        nailTechId,
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
      <DialogContent
        className="max-w-[min(100%,36rem)] sm:max-w-xl flex flex-col gap-2 p-3 sm:p-3.5"
      >
        <DialogHeader className="shrink-0 pb-1 mb-0 pr-7">
          <DialogTitle className="text-base sm:text-lg">
            Edit Slot
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 gap-0">
          <div className="overflow-y-auto flex-1 space-y-2.5 min-h-0">
            <div className="space-y-1">
              <Label htmlFor="editNailTech">Nail Technician</Label>
              {canChangeNailTech ? (
                <Select
                  value={nailTechId}
                  onValueChange={setNailTechId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="editNailTech" className="h-9">
                    <SelectValue placeholder="Select nail tech" />
                  </SelectTrigger>
                  <SelectContent>
                    {nailTechs.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="px-3 py-1.5 bg-ash rounded-none text-sm">
                  {slot.nailTechName || nailTechs[0]?.name || 'Unknown'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="editSlotDate">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  id="editSlotDate"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editSlotTime">
                  Time <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={time}
                  onValueChange={setTime}
                  disabled={isLoading}
                >
                  <SelectTrigger id="editSlotTime" className="h-9">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => {
                      const taken = occupiedTimes.has(option);
                      return (
                        <SelectItem key={option} value={option} disabled={taken}>
                          {formatTime12Hour(option)}{taken ? ' (taken)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isTimeTaken && (
              <small className="text-red-600 text-xs block">
                This time is already used on the selected date for this nail tech.
              </small>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="editSlotStatus">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as EditableSlotStatus)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="editSlotStatus" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="slotType">Slot Type</Label>
                <Select
                  value={slotType}
                  onValueChange={(value) => setSlotType(value as SlotType)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="slotType" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="with_squeeze_fee">With Squeeze Fee (₱500)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this slot..."
                disabled={isLoading}
              />
            </div>

            <div className="flex items-start space-x-3 space-y-0">
              <Checkbox
                id="isHidden"
                checked={isHidden}
                onCheckedChange={(checked) => setIsHidden(checked === true)}
                disabled={isLoading}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="isHidden" className="label-inline">
                  Hide from clients during booking
                </Label>
                <small className="text-muted-foreground text-xs block">
                  Hidden slots won't appear in the public booking calendar
                </small>
              </div>
            </div>

            {(error || externalError) && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error || externalError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex-wrap gap-2 shrink-0 border-t border-border pt-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRequestDelete}
              disabled={isLoading || isDeleting}
              className="mr-auto h-9"
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
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isLoading || isDeleting || isTimeTaken}
              loading={isLoading}
              className="h-9"
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
