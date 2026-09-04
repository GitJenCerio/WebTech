import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
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
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { formatTime12Hour, sortSlotsWithPairedBookings } from '@/lib/utils';
import { normalizeSlotTime } from '@/lib/constants/slots';
import NailTechBadge from '@/components/admin/NailTechBadge';

type Scope = 'day' | 'week' | 'range';
export type BulkSlotAction = 'hide' | 'unhide' | 'delete';

interface NailTech {
  id: string;
  name: string;
}

interface ApiSlot {
  id?: string;
  _id?: string;
  date: string;
  time: string;
  status: string;
  isHidden?: boolean;
  nailTechId?: string;
  booking?: {
    id?: string;
    status?: string;
  } | null;
}

interface ManageableSlot {
  id: string;
  date: string;
  time: string;
  status: string;
  isHidden: boolean;
  nailTechId?: string;
  nailTechName?: string;
  selectable: boolean;
  reason?: string;
}

interface BulkManageSlotsModalProps {
  show: boolean;
  onHide: () => void;
  onApply: (action: BulkSlotAction, ids: string[]) => Promise<{ updated?: number; deleted?: number; skipped?: number }>;
  selectedDate: Date;
  nailTechs?: NailTech[];
  defaultNailTechId?: string;
  isLoading?: boolean;
  error?: string | null;
}

const dateToLocalISOString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekRange = (date: Date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

const formatSlotDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

const displaySlotTime = (time: string) =>
  formatTime12Hour(time).replace(/(\d)(AM|PM)/i, '$1 $2');

function isSelectableSlot(slot: ApiSlot): { selectable: boolean; reason?: string } {
  const bookingStatus = slot.booking?.status;
  if (bookingStatus === 'pending' || bookingStatus === 'confirmed') {
    return { selectable: false, reason: 'Booked' };
  }
  if (slot.status === 'pending' || slot.status === 'confirmed') {
    return { selectable: false, reason: 'Booked' };
  }
  if (slot.status === 'available' || slot.status === 'blocked') {
    return { selectable: true };
  }
  return { selectable: false, reason: slot.status };
}

export default function BulkManageSlotsModal({
  show,
  onHide,
  onApply,
  selectedDate,
  nailTechs = [],
  defaultNailTechId = 'all',
  isLoading = false,
  error: externalError = null,
}: BulkManageSlotsModalProps) {
  const [scope, setScope] = useState<Scope>('day');
  const [startDate, setStartDate] = useState(dateToLocalISOString(selectedDate));
  const [endDate, setEndDate] = useState(dateToLocalISOString(selectedDate));
  const [nailTechId, setNailTechId] = useState(defaultNailTechId || 'all');
  const [slots, setSlots] = useState<ManageableSlot[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canFilterTechs = nailTechs.length > 1;

  useEffect(() => {
    if (!show) return;
    const day = dateToLocalISOString(selectedDate);
    setScope('day');
    setStartDate(day);
    setEndDate(day);
    setNailTechId(defaultNailTechId || 'all');
    setSelectedIds(new Set());
    setError(null);
    setShowDeleteConfirm(false);
    setReloadToken(0);
  }, [show, selectedDate, defaultNailTechId]);

  useEffect(() => {
    if (!show || !startDate || !endDate) return;

    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      setError(null);
      try {
        const params = new URLSearchParams({ startDate, endDate });
        if (nailTechId && nailTechId !== 'all') params.set('nailTechId', nailTechId);
        const response = await fetch(`/api/slots?${params}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load slots');
        }
        const data = await response.json();
        if (cancelled) return;
        const mapped: ManageableSlot[] = (data.slots || []).map((slot: ApiSlot) => {
          const eligibility = isSelectableSlot(slot);
          const rawId = slot.id ?? slot._id;
          const id = typeof rawId === 'string' ? rawId : String(rawId);
          return {
            id,
            date: slot.date,
            time: slot.time,
            status: slot.status,
            isHidden: Boolean(slot.isHidden),
            nailTechId: slot.nailTechId,
            selectable: eligibility.selectable,
            reason: eligibility.reason,
          };
        });
        const sorted = sortSlotsWithPairedBookings(mapped).sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return normalizeSlotTime(a.time).localeCompare(normalizeSlotTime(b.time));
        });
        setSlots(sorted);
        setSelectedIds(new Set());
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load slots');
          setSlots([]);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [show, startDate, endDate, nailTechId, reloadToken]);

  const namedSlots = useMemo(
    () =>
      slots.map((slot) => ({
        ...slot,
        nailTechName: nailTechs.find((tech) => tech.id === slot.nailTechId)?.name,
      })),
    [slots, nailTechs]
  );

  const selectableSlots = useMemo(() => namedSlots.filter((slot) => slot.selectable), [namedSlots]);
  const selectedSelectable = useMemo(
    () => selectableSlots.filter((slot) => selectedIds.has(slot.id)),
    [selectableSlots, selectedIds]
  );
  const groupedSlots = useMemo(() => {
    const groups = new Map<string, ManageableSlot[]>();
    for (const slot of namedSlots) {
      const list = groups.get(slot.date) || [];
      list.push(slot);
      groups.set(slot.date, list);
    }
    return Array.from(groups.entries());
  }, [namedSlots]);

  const allSelectableSelected =
    selectableSlots.length > 0 && selectableSlots.every((slot) => selectedIds.has(slot.id));

  const applyScope = (nextScope: Scope) => {
    setScope(nextScope);
    setSelectedIds(new Set());
    if (nextScope === 'day') {
      const day = dateToLocalISOString(selectedDate);
      setStartDate(day);
      setEndDate(day);
    } else if (nextScope === 'week') {
      const { start, end } = getWeekRange(selectedDate);
      setStartDate(dateToLocalISOString(start));
      setEndDate(dateToLocalISOString(end));
    }
  };

  const toggleSlot = (slot: ManageableSlot) => {
    if (!slot.selectable || isLoading) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(slot.id)) next.delete(slot.id);
      else next.add(slot.id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(selectableSlots.map((slot) => slot.id)));
  };

  const handleApply = async (action: BulkSlotAction) => {
    setError(null);
    const ids =
      action === 'delete'
        ? selectedSelectable.filter((slot) => slot.status === 'available').map((slot) => slot.id)
        : selectedSelectable.map((slot) => slot.id);
    if (ids.length === 0) {
      setError(
        action === 'delete'
          ? 'Only available slots can be deleted. Hide blocked slots instead.'
          : 'Select at least one available or blocked slot'
      );
      return;
    }
    if (action === 'delete') {
      setShowDeleteConfirm(true);
      return;
    }
    try {
      await onApply(action, ids);
      setReloadToken((token) => token + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to update slots');
    }
  };

  const handleConfirmDelete = async () => {
    const ids = selectedSelectable.filter((slot) => slot.status === 'available').map((slot) => slot.id);
    if (ids.length === 0) {
      setError('Only available slots can be deleted. Hide blocked slots instead.');
      setShowDeleteConfirm(false);
      return;
    }
    try {
      await onApply('delete', ids);
      setShowDeleteConfirm(false);
      setReloadToken((token) => token + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to delete slots');
    }
  };

  return (
    <>
    <Dialog open={show} onOpenChange={(open) => !open && !isLoading && onHide()}>
      <DialogContent className="max-w-[min(100%,36rem)] sm:max-w-xl flex flex-col gap-2 p-3 sm:p-3.5">
        <DialogHeader className="shrink-0 pb-1 mb-0 pr-7">
          <DialogTitle className="text-base sm:text-lg">Bulk hide / delete slots</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-2.5 min-h-0">
          <div className="space-y-1">
            <Label>Range</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={scope === 'day' ? 'default' : 'outline'}
                onClick={() => applyScope('day')}
                className="flex-1 h-9 text-sm normal-case tracking-normal"
                disabled={isLoading}
              >
                This day
              </Button>
              <Button
                type="button"
                variant={scope === 'week' ? 'default' : 'outline'}
                onClick={() => applyScope('week')}
                className="flex-1 h-9 text-sm normal-case tracking-normal"
                disabled={isLoading}
              >
                This week
              </Button>
              <Button
                type="button"
                variant={scope === 'range' ? 'default' : 'outline'}
                onClick={() => applyScope('range')}
                className="flex-1 h-9 text-sm normal-case tracking-normal"
                disabled={isLoading}
              >
                Range
              </Button>
            </div>
          </div>

          {scope === 'range' ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="bulkStartDate">Start date</Label>
                <Input
                  type="date"
                  id="bulkStartDate"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  disabled={isLoading}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bulkEndDate">End date</Label>
                <Input
                  type="date"
                  id="bulkEndDate"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isLoading}
                  className="h-9"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {scope === 'day'
                ? formatSlotDate(startDate)
                : `${formatSlotDate(startDate)} – ${formatSlotDate(endDate)}`}
            </p>
          )}

          {canFilterTechs && (
            <div className="space-y-1">
              <Label htmlFor="bulkNailTech">Nail technician</Label>
              <Select value={nailTechId} onValueChange={setNailTechId} disabled={isLoading}>
                <SelectTrigger id="bulkNailTech" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {nailTechs.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {loadingSlots
                ? 'Loading slots...'
                : `${selectableSlots.length} can be changed${namedSlots.length !== selectableSlots.length ? ` · ${namedSlots.length - selectableSlots.length} booked skipped` : ''}`}
            </p>
            {selectableSlots.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={isLoading || loadingSlots}
                className="h-7 text-xs px-2 normal-case tracking-normal"
              >
                {allSelectableSelected ? 'Deselect all' : 'Select all'}
              </Button>
            )}
          </div>

          <div className="border border-border rounded-none bg-ash-soft max-h-[280px] overflow-y-auto">
            {loadingSlots ? (
              <p className="text-xs text-muted-foreground px-3 py-4">Loading slots...</p>
            ) : namedSlots.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-4">No slots in this range.</p>
            ) : (
              groupedSlots.map(([date, dateSlots]) => (
                <div key={date} className="border-b border-border last:border-b-0">
                  <div className="px-3 py-1.5 text-xs font-semibold bg-ash sticky top-0">
                    {formatSlotDate(date)}
                  </div>
                  {dateSlots.map((slot) => {
                    const checked = selectedIds.has(slot.id);
                    return (
                      <label
                        key={slot.id}
                        className={`flex flex-nowrap items-center gap-2.5 px-3 py-2 text-sm border-t border-border/60 ${
                          slot.selectable ? 'cursor-pointer hover:bg-white' : 'opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={!slot.selectable || isLoading}
                          onCheckedChange={() => toggleSlot(slot)}
                        />
                        <span className="inline-flex min-w-0 flex-nowrap items-center gap-2">
                          <span className="shrink-0 whitespace-nowrap tabular-nums font-medium text-ink">
                            {displaySlotTime(slot.time)}
                          </span>
                          <NailTechBadge
                            name={slot.nailTechName || 'Unknown'}
                            nailTechId={slot.nailTechId}
                          />
                        </span>
                        {slot.isHidden && (
                          <span className="shrink-0 rounded-none border border-[#e7e2db] bg-[#e7e2db] px-2 py-0.5 text-[10px] font-medium text-[#78716c]">
                            Hidden
                          </span>
                        )}
                        {slot.status === 'blocked' && (
                          <span className="shrink-0 rounded-none border border-[#e7e2db] bg-[#f7f6f4] px-2 py-0.5 text-[10px] font-medium text-[#78716c]">
                            Blocked
                          </span>
                        )}
                        {!slot.selectable && slot.reason && (
                          <span className="shrink-0 rounded-none border border-[#e7e2db] bg-[#f7f6f4] px-2 py-0.5 text-[10px] font-medium text-[#78716c]">
                            {slot.reason}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ))
            )}
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
            variant="secondary"
            size="sm"
            onClick={onHide}
            disabled={isLoading}
            className="h-9 mr-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleApply('unhide')}
            disabled={isLoading || selectedSelectable.length === 0}
            className="h-9"
          >
            <Eye className="mr-1.5 h-4 w-4" />
            Unhide
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleApply('hide')}
            disabled={isLoading || selectedSelectable.length === 0}
            className="h-9"
          >
            <EyeOff className="mr-1.5 h-4 w-4" />
            Hide
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => handleApply('delete')}
            disabled={isLoading || selectedSelectable.length === 0}
            className="h-9"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title="Delete selected slots"
      description={`Delete ${selectedSelectable.filter((slot) => slot.status === 'available').length} available slot${selectedSelectable.filter((slot) => slot.status === 'available').length === 1 ? '' : 's'}? Booked and blocked slots are skipped. This cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={() => handleConfirmDelete()}
      isLoading={isLoading}
    />
    </>
  );
}
