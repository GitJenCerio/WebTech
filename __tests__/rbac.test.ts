import { assignableRoleFromStored, hasMinimumRole, normalizeRole } from '@/lib/rbac';

describe('rbac', () => {
  describe('normalizeRole', () => {
    it('defaults to STAFF for undefined', () => {
      expect(normalizeRole(undefined)).toBe('STAFF');
    });

    it('normalizes case-insensitively', () => {
      expect(normalizeRole('admin')).toBe('ADMIN');
      expect(normalizeRole('AdMiN')).toBe('ADMIN');
      expect(normalizeRole('staff')).toBe('STAFF');
      expect(normalizeRole('SUPER_ADMIN')).toBe('SUPER_ADMIN');
    });

    it('falls back to STAFF for unknown roles', () => {
      expect(normalizeRole('NOT_A_ROLE')).toBe('STAFF');
    });
  });

  describe('assignableRoleFromStored', () => {
    it('maps MANAGER to ADMIN (not assignable)', () => {
      expect(assignableRoleFromStored('MANAGER')).toBe('ADMIN');
      expect(assignableRoleFromStored('manager')).toBe('ADMIN');
    });

    it('keeps other roles unchanged', () => {
      expect(assignableRoleFromStored('SUPER_ADMIN')).toBe('SUPER_ADMIN');
      expect(assignableRoleFromStored('ADMIN')).toBe('ADMIN');
      expect(assignableRoleFromStored('STAFF')).toBe('STAFF');
    });
  });

  describe('hasMinimumRole', () => {
    it('returns false when user missing', () => {
      expect(hasMinimumRole(null, 'STAFF')).toBe(false);
    });

    it('compares by role hierarchy', () => {
      expect(hasMinimumRole({ role: 'STAFF' }, 'STAFF')).toBe(true);
      expect(hasMinimumRole({ role: 'STAFF' }, 'ADMIN')).toBe(false);

      expect(hasMinimumRole({ role: 'ADMIN' }, 'STAFF')).toBe(true);
      expect(hasMinimumRole({ role: 'ADMIN' }, 'ADMIN')).toBe(true);
      expect(hasMinimumRole({ role: 'ADMIN' }, 'SUPER_ADMIN')).toBe(false);
    });
  });
});

