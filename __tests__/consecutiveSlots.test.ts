import {
  findConsecutiveAvailableSlots,
  assertConsecutiveSlots,
  hasBlockingSlotBetween,
} from '@/lib/utils/consecutiveSlots';

describe('consecutiveSlots', () => {
  const tech = 'tech-1';
  const date = '2026-08-06';

  function slot(id: string, time: string, status: string) {
    return { _id: id, id, date, time, status, nailTechId: tech };
  }

  it('chains the next free slot and skips missing schedule times', () => {
    const all = [
      slot('a', '10:00', 'available'),
      slot('b', '11:00', 'available'), // 10:30 never created
    ];
    const chain = findConsecutiveAvailableSlots(all, all, all[0], 2);
    expect(chain.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('rejects jumping over another client booking', () => {
    const all = [
      slot('a', '10:00', 'available'),
      slot('mid', '10:30', 'confirmed'),
      slot('b', '11:00', 'available'),
    ];
    const available = all.filter((s) => s.status === 'available');
    const chain = findConsecutiveAvailableSlots(all, available, all[0], 2);
    expect(chain).toEqual([]);
    expect(hasBlockingSlotBetween(all, date, tech, '10:00', '11:00')).toBe(true);
  });

  it('rejects skipping a free slot in between', () => {
    const all = [
      slot('a', '10:00', 'available'),
      slot('mid', '10:30', 'available'),
      slot('b', '11:00', 'available'),
    ];
    expect(() => assertConsecutiveSlots([all[0], all[2]], all)).toThrow(/consecutive/i);
  });

  it('accepts the next two free slots', () => {
    const all = [
      slot('a', '10:00', 'available'),
      slot('mid', '10:30', 'available'),
      slot('b', '11:00', 'available'),
    ];
    expect(() => assertConsecutiveSlots([all[0], all[1]], all)).not.toThrow();
  });

  it('treats held slots as available when rescheduling', () => {
    const all = [
      slot('a', '10:00', 'pending'),
      slot('b', '10:30', 'pending'),
    ];
    const held = new Set(['a', 'b']);
    expect(() =>
      assertConsecutiveSlots(all, all, { treatSlotIdsAsAvailable: held })
    ).not.toThrow();
  });
});
