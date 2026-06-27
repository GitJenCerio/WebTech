'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Copy, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SLOT_TIMES, normalizeSlotTime } from '@/lib/constants/slots';
import { formatTime12Hour } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useNailTechs } from '@/lib/hooks/useNailTechs';
import { useUserRole } from '@/lib/hooks/useUserRole';

interface ApiSlot {
  _id?: string;
  id?: string;
  date?: string;
  time: string;
  status: string;
  slotType?: 'regular' | 'with_squeeze_fee' | null;
  isHidden?: boolean;
  nailTechId?: string;
}

interface SlotEntry {
  time: string;
  squeeze: boolean;
}

interface DayGroup {
  dateStr: string;
  label: string;
  times: SlotEntry[];
}

interface TechGroup {
  techId: string;
  techName: string;
  days: DayGroup[];
  total: number;
}

const SITE_BOOKING_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.glammednailsbyjhen.com').replace(/\/$/, '') + '/booking';
const STUDIO_NAME = 'Glammed Nails by Jhen';

export default function AvailableSlotsExport() {
  const { nailTechs, loading: nailTechsLoading } = useNailTechs();
  const userRole = useUserRole();
  const exportRef = useRef<HTMLDivElement>(null);

  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [period, setPeriod] = useState<'month' | 'week'>('month');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'express'>('all');
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Staff with an assigned nail tech can only see their own availability
  useEffect(() => {
    if (userRole.assignedNailTechId) {
      setTechFilter(userRole.assignedNailTechId);
    }
  }, [userRole.assignedNailTechId]);

  const showTechFilter = userRole.canManageAllTechs && !nailTechsLoading;

  const fetchSlots = useCallback(async () => {
    const rangeStart = period === 'week' ? startOfWeek(anchor, { weekStartsOn: 1 }) : startOfMonth(anchor);
    const rangeEnd = period === 'week' ? endOfWeek(anchor, { weekStartsOn: 1 }) : endOfMonth(anchor);
    const startDate = format(rangeStart, 'yyyy-MM-dd');
    const endDate = format(rangeEnd, 'yyyy-MM-dd');
    const params = new URLSearchParams({ startDate, endDate, status: 'available' });
    // Express needs all techs to find simultaneous availability; otherwise honor the tech filter.
    const effectiveTech = viewMode === 'express' ? 'all' : (userRole.assignedNailTechId || techFilter);
    if (effectiveTech && effectiveTech !== 'all') {
      params.append('nailTechId', effectiveTech);
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/slots?${params}`);
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (e) {
      console.error('AvailableSlotsExport fetch error:', e);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [anchor, period, techFilter, viewMode, userRole.assignedNailTechId]);

  useEffect(() => {
    if (!nailTechsLoading) fetchSlots();
  }, [fetchSlots, nailTechsLoading]);

  const techGroups = useMemo<TechGroup[]>(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const nameById = new Map(nailTechs.map((t) => [t.id, t.name]));

    // Only available, visible, present-or-future slots
    const usable = slots.filter(
      (s) =>
        s.status === 'available' &&
        !s.isHidden &&
        !!s.date &&
        (s.date as string) >= todayStr
    );

    // techId -> dateStr -> SlotEntry[]
    const byTech = new Map<string, Map<string, SlotEntry[]>>();
    for (const s of usable) {
      const techId = s.nailTechId || 'unknown';
      const dateStr = s.date as string;
      const time = normalizeSlotTime(s.time);
      const squeeze = s.slotType === 'with_squeeze_fee';
      if (!byTech.has(techId)) byTech.set(techId, new Map());
      const byDate = byTech.get(techId)!;
      if (!byDate.has(dateStr)) byDate.set(dateStr, []);
      byDate.get(dateStr)!.push({ time, squeeze });
    }

    // Decide which techs to render (so techs with no slots still show when "all")
    let techIds: string[];
    if (techFilter !== 'all') {
      techIds = [techFilter];
    } else if (userRole.assignedNailTechId) {
      techIds = [userRole.assignedNailTechId];
    } else {
      techIds = nailTechs.map((t) => t.id);
    }

    const timeOrder = (t: string) => {
      const idx = SLOT_TIMES.indexOf(normalizeSlotTime(t) as (typeof SLOT_TIMES)[number]);
      return idx === -1 ? 999 : idx;
    };

    return techIds.map((techId) => {
      const byDate = byTech.get(techId);
      const days: DayGroup[] = [];
      if (byDate) {
        const sortedDates = Array.from(byDate.keys()).sort();
        for (const dateStr of sortedDates) {
          const times = byDate.get(dateStr)!.sort((a, b) => timeOrder(a.time) - timeOrder(b.time));
          days.push({
            dateStr,
            label: format(new Date(`${dateStr}T00:00:00`), 'EEE, MMM d'),
            times,
          });
        }
      }
      const total = days.reduce((sum, d) => sum + d.times.length, 0);
      return {
        techId,
        techName: nameById.get(techId) || 'Nail Tech',
        days,
        total,
      };
    });
  }, [slots, nailTechs, techFilter, userRole.assignedNailTechId]);

  // Mani + Pedi Express: date+time where 2+ different techs are available simultaneously
  const expressDays = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const usable = slots.filter(
      (s) => s.status === 'available' && !s.isHidden && !!s.date && (s.date as string) >= todayStr
    );

    // dateStr -> time -> Map(techId -> isSqueeze)
    const byDate = new Map<string, Map<string, Map<string, boolean>>>();
    for (const s of usable) {
      const dateStr = s.date as string;
      const time = normalizeSlotTime(s.time);
      const techId = s.nailTechId || 'unknown';
      const squeeze = s.slotType === 'with_squeeze_fee';
      if (!byDate.has(dateStr)) byDate.set(dateStr, new Map());
      const byTime = byDate.get(dateStr)!;
      if (!byTime.has(time)) byTime.set(time, new Map());
      byTime.get(time)!.set(techId, squeeze);
    }

    const timeOrder = (t: string) => {
      const idx = SLOT_TIMES.indexOf(normalizeSlotTime(t) as (typeof SLOT_TIMES)[number]);
      return idx === -1 ? 999 : idx;
    };

    const result: Array<{
      dateStr: string;
      label: string;
      times: Array<{ time: string; techCount: number; squeezeUnits: number }>;
    }> = [];
    for (const dateStr of Array.from(byDate.keys()).sort()) {
      const byTime = byDate.get(dateStr)!;
      const times = Array.from(byTime.entries())
        .filter(([, techs]) => techs.size >= 2)
        .map(([time, techs]) => {
          const regCount = Array.from(techs.values()).filter((sq) => !sq).length;
          // Express needs 2 slots; use regular first, remaining must be squeeze slots
          const squeezeUnits = Math.max(0, 2 - regCount);
          return { time, techCount: techs.size, squeezeUnits };
        })
        .sort((a, b) => timeOrder(a.time) - timeOrder(b.time));
      if (times.length > 0) {
        result.push({
          dateStr,
          label: format(new Date(`${dateStr}T00:00:00`), 'EEE, MMM d'),
          times,
        });
      }
    }
    return result;
  }, [slots]);

  const rangeStart = period === 'week' ? startOfWeek(anchor, { weekStartsOn: 1 }) : startOfMonth(anchor);
  const rangeEnd = period === 'week' ? endOfWeek(anchor, { weekStartsOn: 1 }) : endOfMonth(anchor);
  const periodLabel =
    period === 'week'
      ? `${format(rangeStart, 'MMM d')} – ${format(rangeEnd, 'MMM d, yyyy')}`
      : format(anchor, 'MMMM yyyy');
  const filePeriodPart = period === 'week' ? format(rangeStart, 'yyyy-MM-dd') : format(anchor, 'yyyy-MM');
  const grandTotal = techGroups.reduce((sum, g) => sum + g.total, 0);
  const expressTotal = expressDays.reduce((sum, d) => sum + d.times.length, 0);
  const hasContent = viewMode === 'express' ? expressTotal > 0 : grandTotal > 0;

  const handleDownloadImage = async () => {
    if (!exportRef.current) return;
    try {
      setDownloading(true);
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const techPart =
        viewMode === 'express'
          ? 'express'
          : techFilter !== 'all'
            ? (nailTechs.find((t) => t.id === techFilter)?.name || 'tech').replace(/\s+/g, '-').toLowerCase()
            : 'all';
      link.download = `available-slots-${techPart}-${filePeriodPart}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Image downloaded');
    } catch (e) {
      console.error('Download image error:', e);
      toast.error('Could not generate image');
    } finally {
      setDownloading(false);
    }
  };

  const buildText = useCallback(() => {
    const lines: string[] = [];
    if (viewMode === 'express') {
      lines.push(`${STUDIO_NAME} — Mani + Pedi Express Available Slots`);
      lines.push(periodLabel);
      lines.push('');
      if (expressDays.length === 0) {
        lines.push('No Express slots available (needs 2 nail techs free at the same time).');
      } else {
        for (const d of expressDays) {
          const times = d.times
            .map((t) => {
              const base = formatTime12Hour(t.time);
              if (t.squeezeUnits >= 2) return `${base} (SQ x2 +1,000)`;
              if (t.squeezeUnits === 1) return `${base} (SQ +500)`;
              return base;
            })
            .join(', ');
          lines.push(`  • ${d.label}: ${times}`);
        }
      }
      lines.push('');
      lines.push('Mani + Pedi Express = 2 nail techs at the same time (+₱300 fee).');
      lines.push('SQ = squeeze-in slot (+₱500 each). Express uses 2 slots, so 2 squeeze slots = x2 fee (+₱1,000).');
      lines.push(`Book online: ${SITE_BOOKING_URL}`);
      lines.push('Slots are subject to change.');
      return lines.join('\n');
    }

    lines.push(`${STUDIO_NAME} — Available Slots`);
    lines.push(periodLabel);
    lines.push('');
    for (const g of techGroups) {
      lines.push(`${g.techName}`);
      if (g.days.length === 0) {
        lines.push('  (Fully booked — no available slots)');
      } else {
        for (const d of g.days) {
          const times = d.times
            .map((t) => (t.squeeze ? `${formatTime12Hour(t.time)} (SQ +500)` : formatTime12Hour(t.time)))
            .join(', ');
          lines.push(`  • ${d.label}: ${times}`);
        }
      }
      lines.push('');
    }
    lines.push('Legend: Regular slots = standard. SQ slots = squeeze-in with +500 add-on fee.');
    lines.push(`Book online: ${SITE_BOOKING_URL}`);
    lines.push('Slots are subject to change.');
    return lines.join('\n');
  }, [techGroups, expressDays, periodLabel, viewMode]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy error:', e);
      toast.error('Could not copy text');
    }
  };

  return (
    <Card className="w-full max-w-full mt-6 border border-[#e5e5e5] rounded-2xl bg-white shadow-sm overflow-hidden">
      <CardContent className="p-4">
        {/* Controls */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Lato', sans-serif" }}>
              Shareable Available Slots
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-[#e5e5e5] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setPeriod('month')}
                  className={`h-8 px-3 text-xs rounded-md transition-all ${
                    period === 'month' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-[#1a1a1a]'
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('week')}
                  className={`h-8 px-3 text-xs rounded-md transition-all ${
                    period === 'week' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-[#1a1a1a]'
                  }`}
                >
                  Week
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAnchor((d) => (period === 'week' ? subWeeks(d, 1) : subMonths(d, 1)))
                }
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                aria-label={period === 'week' ? 'Previous week' : 'Previous month'}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-[#1a1a1a] min-w-[150px] text-center">{periodLabel}</span>
              <button
                type="button"
                onClick={() =>
                  setAnchor((d) => (period === 'week' ? addWeeks(d, 1) : addMonths(d, 1)))
                }
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-500 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
                aria-label={period === 'week' ? 'Next week' : 'Next month'}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'all' | 'express')}>
                <SelectTrigger className="h-9 w-full sm:w-[200px] shrink-0 text-xs px-3 rounded-xl border border-[#e5e5e5]">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all" className="text-xs">All available slots</SelectItem>
                  <SelectItem value="express" className="text-xs">Mani + Pedi Express slots</SelectItem>
                </SelectContent>
              </Select>

              {showTechFilter && nailTechs.length > 0 && viewMode !== 'express' && (
                <Select value={techFilter} onValueChange={setTechFilter}>
                  <SelectTrigger className="h-9 w-full sm:w-[180px] shrink-0 text-xs px-3 rounded-xl border border-[#e5e5e5]">
                    <SelectValue placeholder="All Nail Techs" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="all" className="text-xs">All Nail Techs</SelectItem>
                    {nailTechs.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id} className="text-xs">
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchSlots}
                disabled={loading}
                className="h-9 px-3 text-xs rounded-lg border border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa] transition-all flex items-center gap-1.5 disabled:opacity-60"
                title="Refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleCopyText}
                disabled={loading || !hasContent}
                className="h-9 px-3 text-xs rounded-lg border border-[#e5e5e5] bg-white text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fafafa] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy Text
              </button>
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={downloading || loading || !hasContent}
                className="h-9 px-3 text-xs rounded-lg bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className={`h-3.5 w-3.5 ${downloading ? 'animate-pulse' : ''}`} />
                {downloading ? 'Generating…' : 'Download Image'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview / export surface */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a1a1a] border-t-transparent" role="status" aria-label="Loading" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div
              ref={exportRef}
              style={{
                width: 640,
                maxWidth: '100%',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                padding: 28,
                fontFamily: "'Lato', Arial, sans-serif",
                color: '#1a1a1a',
                border: '1px solid #ececec',
                borderRadius: 12,
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1a1a1a', paddingBottom: 14, marginBottom: 18 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt={STUDIO_NAME}
                  style={{ height: 56, width: 'auto', objectFit: 'contain', display: 'inline-block' }}
                  crossOrigin="anonymous"
                />
                <div style={{ fontSize: 14, color: '#8a6d3b', fontWeight: 600, marginTop: 8 }}>
                  {viewMode === 'express' ? 'Mani + Pedi Express — Available Slots' : 'Available Slots'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{periodLabel}</div>
              </div>

              {/* Legend */}
              {viewMode === 'express' ? (
                <div style={{ textAlign: 'center', marginBottom: 18, fontSize: 12, color: '#444' }}>
                  <span style={{ fontWeight: 600, color: '#b45309' }}>
                    Mani + Pedi Express = 2 nail techs at the same time (+₱300 fee).
                  </span>
                  <div style={{ marginTop: 2, color: '#888' }}>
                    Times below have at least 2 nail techs available simultaneously.
                  </div>
                  <div style={{ marginTop: 2, color: '#6b21a8', fontWeight: 600 }}>
                    SQ = squeeze-in (+₱500 each). 2 squeeze slots = x2 fee (+₱1,000).
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 16,
                    marginBottom: 18,
                    fontSize: 12,
                    color: '#444',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        backgroundColor: '#eef6ee',
                        border: '1px solid #cfe6cf',
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontWeight: 600, color: '#1f6b32' }}>Green = Regular slots</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        backgroundColor: '#f3eafc',
                        border: '1px solid #e0cdf2',
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontWeight: 600, color: '#6b21a8' }}>Purple = Squeeze-in slots (+₱500 add-on)</span>
                  </span>
                </div>
              )}

              {viewMode === 'express' ? (
                expressDays.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', padding: '28px 0', fontSize: 14 }}>
                    No Express slots this {period} (needs 2 nail techs free at the same time).
                  </div>
                ) : (
                  <div>
                    {expressDays.map((d) => (
                      <div
                        key={d.dateStr}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: '7px 8px',
                          borderBottom: '1px solid #f0f0f0',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ minWidth: 96, fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
                          {d.label}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {d.times.map((t) => {
                            const isSqueeze = t.squeezeUnits > 0;
                            return (
                              <span
                                key={t.time}
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  backgroundColor: isSqueeze ? '#f3eafc' : '#fdf3e7',
                                  color: isSqueeze ? '#6b21a8' : '#b45309',
                                  border: `1px solid ${isSqueeze ? '#e0cdf2' : '#f3dcc0'}`,
                                  borderRadius: 999,
                                  padding: '2px 9px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {formatTime12Hour(t.time)}
                                {t.squeezeUnits >= 2 ? ' • SQ x2' : t.squeezeUnits === 1 ? ' • SQ' : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : grandTotal === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', padding: '28px 0', fontSize: 14 }}>
                  No available slots for this {period}.
                </div>
              ) : (
                techGroups.map((g) => (
                  <div key={g.techId} style={{ marginBottom: 18 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        backgroundColor: '#f6f1ea',
                        color: '#1a1a1a',
                        padding: '6px 12px',
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    >
                      {g.techName}
                      <span style={{ float: 'right', fontWeight: 600, color: '#8a6d3b', fontSize: 13 }}>
                        {g.total} slot{g.total !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {g.days.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#b00020', padding: '2px 12px' }}>
                        Fully booked — no available slots
                      </div>
                    ) : (
                      <div style={{ padding: '0 4px' }}>
                        {g.days.map((d) => (
                          <div
                            key={d.dateStr}
                            style={{
                              display: 'flex',
                              gap: 10,
                              padding: '6px 8px',
                              borderBottom: '1px solid #f0f0f0',
                              alignItems: 'flex-start',
                            }}
                          >
                            <div style={{ minWidth: 96, fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
                              {d.label}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {d.times.map((t) => (
                                <span
                                  key={`${t.time}-${t.squeeze ? 'sq' : 'reg'}`}
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    backgroundColor: t.squeeze ? '#f3eafc' : '#eef6ee',
                                    color: t.squeeze ? '#6b21a8' : '#1f6b32',
                                    border: `1px solid ${t.squeeze ? '#e0cdf2' : '#cfe6cf'}`,
                                    borderRadius: 999,
                                    padding: '2px 9px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {formatTime12Hour(t.time)}
                                  {t.squeeze ? ' • SQ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Footer */}
              <div style={{ borderTop: '1px solid #ececec', marginTop: 12, paddingTop: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Book online: {SITE_BOOKING_URL}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  Slots are subject to change. Reserved slots are removed once booked.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
