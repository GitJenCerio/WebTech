/**
 * Role-Based Access Control (RBAC)
 * 4 roles: SUPER_ADMIN, ADMIN, MANAGER, STAFF
 * Hierarchy: SUPER_ADMIN > ADMIN > MANAGER > STAFF
 */

export type RbacRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF';

/** Map legacy roles to new roles (for migration) */
export const LEGACY_ROLE_MAP: Record<string, RbacRole> = {
  admin: 'ADMIN',
  staff: 'STAFF',
};

export function normalizeRole(role: string | undefined): RbacRole {
  if (!role) return 'STAFF';
  const upper = role.toUpperCase();
  if (['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'].includes(upper)) {
    return upper as RbacRole;
  }
  return (LEGACY_ROLE_MAP[role.toLowerCase()] as RbacRole) || 'STAFF';
}

const ROLE_LEVEL: Record<RbacRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  STAFF: 1,
};

export interface SessionUser {
  role?: string;
  assignedNailTechId?: string | null;
}

/** Check if user has at least the given role level */
export function hasMinimumRole(user: SessionUser | null, minimum: RbacRole): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minimum];
}

/** SUPER_ADMIN only */
export function isSuperAdmin(user: SessionUser | null): boolean {
  return normalizeRole(user?.role) === 'SUPER_ADMIN';
}

/** ADMIN or SUPER_ADMIN (operational management) */
export function isAdminOrAbove(user: SessionUser | null): boolean {
  return hasMinimumRole(user, 'ADMIN');
}

/** MANAGER or above (read reports, analytics) */
export function isManagerOrAbove(user: SessionUser | null): boolean {
  return hasMinimumRole(user, 'MANAGER');
}

/** Can manage users (create, edit, delete) - SUPER_ADMIN only */
export function canManageUsers(user: SessionUser | null): boolean {
  return isSuperAdmin(user);
}

/** Can delete customers - SUPER_ADMIN only */
export function canDeleteCustomer(user: SessionUser | null): boolean {
  return isSuperAdmin(user);
}

/** Can manage system settings - SUPER_ADMIN only */
export function canManageSettings(user: SessionUser | null): boolean {
  return isSuperAdmin(user);
}

/** Can view audit logs - SUPER_ADMIN only */
export function canViewAuditLog(user: SessionUser | null): boolean {
  return isSuperAdmin(user);
}

/** Can manage time slots (create, edit, delete) - ADMIN, SUPER_ADMIN */
export function canManageSlots(user: SessionUser | null): boolean {
  return isAdminOrAbove(user);
}

/** Can edit bookings (confirm, cancel, reschedule, update payment) - ADMIN, SUPER_ADMIN. STAFF can only mark_completed, mark_no_show */
export function canEditBookings(user: SessionUser | null): boolean {
  return isAdminOrAbove(user);
}

/** Can confirm payment / manual confirm - ADMIN, SUPER_ADMIN (STAFF cannot) */
export function canConfirmPayment(user: SessionUser | null): boolean {
  return isAdminOrAbove(user);
}

/** Can create/edit/delete customers (except delete) - ADMIN, SUPER_ADMIN, MANAGER is read-only */
export function canManageCustomers(user: SessionUser | null): boolean {
  return isAdminOrAbove(user);
}

/** Can manage nail techs - ADMIN, SUPER_ADMIN */
export function canManageNailTechs(user: SessionUser | null): boolean {
  return isAdminOrAbove(user);
}

/** Can create/manage quotations - ADMIN, SUPER_ADMIN */
export function canManageQuotations(user: SessionUser | null): boolean {
  return isAdminOrAbove(user);
}

/** Can view reports - MANAGER, ADMIN, SUPER_ADMIN */
export function canViewReports(user: SessionUser | null): boolean {
  return isManagerOrAbove(user);
}

/** STAFF can only mark complete or no-show (limited booking actions) */
export function canStaffMarkCompleteOrNoShow(user: SessionUser | null): boolean {
  return normalizeRole(user?.role) === 'STAFF';
}

/** User has scope restriction (STAFF = limited to assigned nail tech) */
export function hasAssignedNailTech(user: SessionUser | null): boolean {
  return !!user?.assignedNailTechId;
}
