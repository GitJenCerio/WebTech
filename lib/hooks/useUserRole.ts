'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export type UserRole = 'admin' | 'staff' | 'nail_tech';

interface UserRoleData {
  role: UserRole;
  assignedNailTechId?: string;
  assignedNailTechName?: string;
  canManageAllTechs: boolean;
}

// Mock user role - in production, this would come from the session/database
export function useUserRole(): UserRoleData {
  const { data: session } = useSession();

  // Mock: In production, get this from session or API
  // For now, default to admin. Staff users would have assignedNailTechId
  const userRole = useMemo(() => {
    // This would come from the database/session
    // For demo: check if email contains 'staff' or 'tech'
    const email = session?.user?.email || '';
    
    if (email.includes('staff') || email.includes('tech')) {
      return {
        role: 'staff' as UserRole,
        assignedNailTechId: '1', // Mock assigned tech ID
        assignedNailTechName: 'Jhen', // Mock assigned tech name
        canManageAllTechs: false,
      };
    }
    
    return {
      role: 'admin' as UserRole,
      canManageAllTechs: true,
    };
  }, [session]);

  return userRole;
}
