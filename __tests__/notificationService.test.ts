import { isWithinWindow, manilaDateTimeToUtc } from '@/lib/services/notificationService';

describe('notificationService helpers', () => {
  describe('manilaDateTimeToUtc', () => {
    it('returns null for missing inputs', () => {
      expect(manilaDateTimeToUtc(undefined, '10:00')).toBeNull();
      expect(manilaDateTimeToUtc('2026-04-01', undefined)).toBeNull();
    });

    it('converts Manila local date+time to UTC Date (UTC = Manila - 8h)', () => {
      // 2026-04-01 10:00 in Manila should be 2026-04-01 02:00 UTC.
      const d = manilaDateTimeToUtc('2026-04-01', '10:00');
      expect(d).not.toBeNull();
      expect(d!.toISOString()).toBe('2026-04-01T02:00:00.000Z');
    });

    it('handles midnight rollover correctly', () => {
      // 2026-04-01 01:30 Manila should be 2026-03-31 17:30 UTC.
      const d = manilaDateTimeToUtc('2026-04-01', '01:30');
      expect(d).not.toBeNull();
      expect(d!.toISOString()).toBe('2026-03-31T17:30:00.000Z');
    });
  });

  describe('isWithinWindow', () => {
    it('is true when within ±20 minutes', () => {
      const target = new Date('2026-04-01T00:00:00.000Z');
      const nowPlus19m = new Date(target.getTime() + 19 * 60 * 1000);
      const nowMinus20m = new Date(target.getTime() - 20 * 60 * 1000);

      expect(isWithinWindow(target, nowPlus19m)).toBe(true);
      expect(isWithinWindow(target, nowMinus20m)).toBe(true);
    });

    it('is false when outside ±20 minutes', () => {
      const target = new Date('2026-04-01T00:00:00.000Z');
      const nowPlus21m = new Date(target.getTime() + 21 * 60 * 1000);
      const nowMinus21m = new Date(target.getTime() - 21 * 60 * 1000);

      expect(isWithinWindow(target, nowPlus21m)).toBe(false);
      expect(isWithinWindow(target, nowMinus21m)).toBe(false);
    });
  });
});

