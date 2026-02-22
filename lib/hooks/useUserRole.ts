'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export type UserRole = 'admin' | 'staff' | 'nail_tech';

interface UserRoleData {
  role: UserRole;
  assignedNailTechId?: string | null;
  canManageAllTechs: boolean;
}

export function useUserRole(): UserRoleData {
  const { data: session } = useSession();

  return useMemo(() => {
    const role = (session?.user?.role || 'admin') as UserRole;
    const assignedNailTechId = session?.user?.assignedNailTechId ?? null;

    return {
      role,
      assignedNailTechId: assignedNailTechId || undefined,
      canManageAllTechs: !assignedNailTechId || role === 'admin',
    };
  }, [session?.user?.role, session?.user?.assignedNailTechId]);
}
