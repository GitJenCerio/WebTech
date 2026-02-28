'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import {
  normalizeRole,
  canManageUsers,
  canViewAuditLog,
  canManageSettings,
  canDeleteCustomer,
  isAdminOrAbove,
  type RbacRole,
} from '@/lib/rbac';

export type UserRole = RbacRole | 'nail_tech';

interface UserRoleData {
  role: UserRole;
  assignedNailTechId?: string | null;
  /** Can manage all nail techs (no scope restriction) — ADMIN and above */
  canManageAllTechs: boolean;
  /** SUPER_ADMIN only: user management */
  canManageUsers: boolean;
  /** SUPER_ADMIN only: view audit logs */
  canViewAudit: boolean;
  /** SUPER_ADMIN only: manage settings */
  canManageSettings: boolean;
  /** SUPER_ADMIN only: delete customers */
  canDeleteCustomer: boolean;
}

export function useUserRole(): UserRoleData {
  const { data: session } = useSession();

  return useMemo(() => {
    const role = normalizeRole(session?.user?.role as string | undefined) as UserRole;
    const assignedNailTechId = session?.user?.assignedNailTechId ?? null;
    const user = session?.user
      ? { role: session.user.role, assignedNailTechId }
      : null;

    return {
      role,
      assignedNailTechId: assignedNailTechId || undefined,
      canManageAllTechs: isAdminOrAbove(user),
      canManageUsers: canManageUsers(user),
      canViewAudit: canViewAuditLog(user),
      canManageSettings: canManageSettings(user),
      canDeleteCustomer: canDeleteCustomer(user),
    };
  }, [
    session?.user?.role,
    session?.user?.assignedNailTechId,
  ]);
}
