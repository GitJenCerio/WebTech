import React, { useState, useMemo } from 'react';
import { BookingStatus } from '../StatusBadge';
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
import { Alert, AlertDescription } from '@/components/ui/Alert';

export type SlotType = 'regular' | 'with_squeeze_fee';
type AddMode = 'single' | 'bulk';

interface NailTech {
  id: string;
  name: string;
  role?: string;
}

interface ExistingSlot {
  date: string;
  time: string;
  nailTechId: string;
}

interface AddSlotModalProps {
  show: boolean;
  onHide: () => void;
  onAdd: (slots: Array<{
    date: string;
    time: string;
    status: BookingStatus;
    type: SlotType;
    nailTechId: string;
    notes?: string;
  }>) => void;
  selectedDate?: Date;
  nailTechs?: NailTech[];
  defaultNailTechId?: string;
  existingSlots?: ExistingSlot[];
}

// Generate time options from 7:00 AM to 9:00 PM with 30-minute increments
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const date = new Date(`2000-01-01T${time24}`);
      const time12 = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      times.push(time12);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

// Helper function to convert Date to YYYY-MM-DD string using local timezone (not UTC)
const dateToLocalISOString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddSlotModal({
  show,
  onHide,
  onAdd,
  selectedDate,
  nailTechs = [],
  defaultNailTechId,
  existingSlots = [],
}: AddSlotModalProps) {
  const [addMode, setAddMode] = useState<AddMode>('single');
  const [selectedNailTechId, setSelectedNailTechId] = useState<string>(
    defaultNailTechId || (nailTechs.length > 0 ? nailTechs[0].id : '')
  );
  const [startDate, setStartDate] = useState(
    selectedDate
      ? dateToLocalISOString(selectedDate)
      : dateToLocalISOString(new Date())
  );
  const [endDate, setEndDate] = useState(
    selectedDate
      ? dateToLocalISOString(selectedDate)
      : dateToLocalISOString(new Date())
  );
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [status, setStatus] = useState<BookingStatus>('available');
  const [slotType, setSlotType] = useState<SlotType>('regular');
  const [notes, setNotes] = useState('');

  // Get already added times for the selected nail tech and date
  const addedTimesForDate = useMemo(() => {
    if (!selectedNailTechId) return new Set<string>();
    return new Set(
      existingSlots
        .filter((slot) => slot.nailTechId === selectedNailTechId && slot.date === startDate)
        .map((slot) => slot.time)
    );
  }, [selectedNailTechId, startDate, existingSlots]);

  // Available times (not yet added for selected tech and date)
  const availableTimeOptions = useMemo(() => {
    return timeOptions.filter((time) => !addedTimesForDate.has(time));
  }, [addedTimesForDate]);

  const handleTimeToggle = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time)
        ? prev.filter((t) => t !== time)
        : [...prev, time].sort((a, b) => {
            const timeA = new Date(`2000-01-01 ${a}`);
            const timeB = new Date(`2000-01-01 ${b}`);
            return timeA.getTime() - timeB.getTime();
          })
    );
  };

  const handleSelectAllTimes = () => {
    if (selectedTimes.length === availableTimeOptions.length) {
      setSelectedTimes([]);
    } else {
      setSelectedTimes([...availableTimeOptions]);
    }
  };

  const getDatesInRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    for (
      let date = new Date(startDateObj);
      date <= endDateObj;
      date.setDate(date.getDate() + 1)
    ) {
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNailTechId || selectedTimes.length === 0) {
      return;
    }

    const dates = addMode === 'single' ? [startDate] : getDatesInRange(startDate, endDate);
    const slots: Array<{
      date: string;
      time: string;
      status: BookingStatus;
      type: SlotType;
      nailTechId: string;
      notes?: string;
    }> = [];

    dates.forEach((date) => {
      selectedTimes.forEach((time) => {
        slots.push({
          date,
          time,
          status,
          type: slotType,
          nailTechId: selectedNailTechId,
          notes: notes || undefined,
        });
      });
    });

    onAdd(slots);

    // Reset form
    setSelectedTimes([]);
    setNotes('');
    setStatus('available');
    setSlotType('regular');
    setAddMode('single');
    onHide();
  };

  const datesInRange = addMode === 'single' ? [startDate] : getDatesInRange(startDate, endDate);
  const totalSlots = selectedTimes.length * datesInRange.length;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-2xl md:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {addMode === 'single' ? 'Add Slot' : 'Add Bulk Slots'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            {/* Step 1: Select Nail Tech First */}
            {nailTechs.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="nailTech" className="text-xs">
                  Nail Technician <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedNailTechId}
                  onValueChange={(value) => {
                    setSelectedNailTechId(value);
                    setSelectedTimes([]);
                  }}
                  required
                >
                  <SelectTrigger id="nailTech" className="w-[130px] h-9 text-xs rounded-xl px-3">
                    <SelectValue placeholder="-- Select Nail Tech --" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {nailTechs.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id} className="text-xs">
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <small className="text-gray-500 text-xs block">
                  Select the nail tech first to see available time slots
                </small>
              </div>
            )}

            {/* Step 2: Toggle Add Mode */}
            {selectedNailTechId && (
              <div className="space-y-1.5 mt-2">
                <Label className="text-sm">Add Mode</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={addMode === 'single' ? 'default' : 'outline'}
                    onClick={() => {
                      setAddMode('single');
                      setSelectedTimes([]);
                    }}
                    className="flex-1 h-9 text-sm"
                  >
                    <i className="bi bi-calendar-day mr-1.5"></i>Add Single Day
                  </Button>
                  <Button
                    type="button"
                    variant={addMode === 'bulk' ? 'default' : 'outline'}
                    onClick={() => {
                      setAddMode('bulk');
                      setSelectedTimes([]);
                    }}
                    className="flex-1 h-9 text-sm"
                  >
                    <i className="bi bi-calendar-range mr-1.5"></i>Add Bulk
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Date Selection */}
            {selectedNailTechId && (
              <>
                {addMode === 'single' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="singleDate" className="text-sm">
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      id="singleDate"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setEndDate(e.target.value);
                        setSelectedTimes([]);
                      }}
                      required
                      className="h-9"
                    />
                    <small className="text-gray-500 text-xs block">
                      <strong>{addedTimesForDate.size}</strong> slots already added on this day
                    </small>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate" className="text-sm">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setSelectedTimes([]);
                        }}
                        required
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="endDate" className="text-sm">
                        End Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setSelectedTimes([]);
                        }}
                        required
                        min={startDate}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 4: Time Selection */}
            {selectedNailTechId && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">
                    Select Time Slots <span className="text-red-500">*</span>
                  </Label>
                  {availableTimeOptions.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllTimes}
                      className="h-7 text-xs px-2"
                    >
                      {selectedTimes.length === availableTimeOptions.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  )}
                </div>
                {availableTimeOptions.length > 0 ? (
                  <div className="border border-gray-200 rounded-2xl p-2 bg-gray-50">
                    <div className="grid grid-cols-3 gap-1.5">
                      {availableTimeOptions.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          variant={selectedTimes.includes(time) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleTimeToggle(time)}
                          className="text-xs h-7 px-2"
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert variant="warning" className="py-2">
                    <AlertDescription className="text-xs">
                      <i className="bi bi-info-circle mr-2"></i>
                      All available time slots are already added for this {addMode === 'single' ? 'day' : 'nail tech'}.
                    </AlertDescription>
                  </Alert>
                )}
                {selectedTimes.length > 0 && (
                  <small className="text-gray-500 text-xs block">
                    {selectedTimes.length} time{selectedTimes.length !== 1 ? 's' : ''} selected
                  </small>
                )}
              </div>
            )}

            {/* Step 5: Slot Configuration */}
            {selectedNailTechId && selectedTimes.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="slotStatus" className="text-sm">Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as BookingStatus)}
                    >
                      <SelectTrigger id="slotStatus" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="slotType" className="text-sm">Slot Type</Label>
                    <Select
                      value={slotType}
                      onValueChange={(value) => setSlotType(value as SlotType)}
                    >
                      <SelectTrigger id="slotType" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="with_squeeze_fee">With Squeeze-in Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Total Slots to Create</Label>
                  <div className="px-3 py-1.5 bg-gray-100 rounded-2xl font-semibold text-sm">
                    {totalSlots} slot{totalSlots !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="slotNotes" className="text-sm">Notes (Optional)</Label>
                  <Textarea
                    id="slotNotes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about these slots..."
                    className="text-sm"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="pt-3 pb-2">
            <Button type="button" variant="secondary" onClick={onHide} className="h-9 text-sm">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={!selectedNailTechId || selectedTimes.length === 0}
              className="h-9 text-sm"
            >
              <i className="bi bi-plus-circle mr-1.5"></i>
              Add {totalSlots} Slot{totalSlots !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
