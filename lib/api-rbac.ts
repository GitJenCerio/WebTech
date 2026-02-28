/**
 * API helpers for RBAC: requireRole checks and 403 responses with audit logging.
 */
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import {
  canManageUsers,
  canDeleteCustomer,
  canManageSettings,
  canViewAuditLog,
  type SessionUser,
} from '@/lib/rbac';
import { logAuthFailure } from '@/lib/services/auditLog';

function toSessionUser(session: Session | null): SessionUser | null {
  if (!session?.user) return null;
  return {
    role: (session.user as { role?: string }).role,
    assignedNailTechId: (session.user as { assignedNailTechId?: string | null }).assignedNailTechId ?? null,
  };
}

/** Returns 403 response and logs auth failure. Caller should return this. */
async function forbidden(
  session: Session | null,
  action: string,
  resource: string,
  resourceId?: string,
  req?: Request
): Promise<NextResponse> {
  await logAuthFailure({
    userId: session?.user?.id,
    userEmail: session?.user?.email ?? undefined,
    userName: session?.user?.name ?? undefined,
    action,
    resource,
    resourceId,
    details: { reason: 'Insufficient role' },
    req,
  });
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/** Require SUPER_ADMIN for user management. Returns 403 response if not allowed. */
export async function requireCanManageUsers(
  session: Session | null,
  req?: Request
): Promise<NextResponse | null> {
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (canManageUsers(toSessionUser(session))) return null;
  return forbidden(session, 'manage_users', 'users', undefined, req);
}

/** Require SUPER_ADMIN for delete customer. Returns 403 response if not allowed. */
export async function requireCanDeleteCustomer(
  session: Session | null,
  customerId: string,
  req?: Request
): Promise<NextResponse | null> {
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (canDeleteCustomer(toSessionUser(session))) return null;
  return forbidden(session, 'delete_customer', 'customers', customerId, req);
}

/** Require SUPER_ADMIN for settings. Returns 403 response if not allowed. */
export async function requireCanManageSettings(
  session: Session | null,
  req?: Request
): Promise<NextResponse | null> {
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (canManageSettings(toSessionUser(session))) return null;
  return forbidden(session, 'manage_settings', 'settings', undefined, req);
}

/** Require SUPER_ADMIN for audit log. Returns 403 response if not allowed. */
export async function requireCanViewAudit(
  session: Session | null,
  req?: Request
): Promise<NextResponse | null> {
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (canViewAuditLog(toSessionUser(session))) return null;
  return forbidden(session, 'view_audit', 'audit', undefined, req);
}
