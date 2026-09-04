import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { handleApiError } from '@/lib/apiError';
import { requireCanManageCustomers } from '@/lib/api-rbac';
import { banClient, unbanCustomer } from '@/lib/services/clientBanService';
import { logAuditAction } from '@/lib/services/auditLog';

export const dynamic = 'force-dynamic';

const banBodySchema = z.object({
  reason: z.string().max(1000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const forbid = await requireCanManageCustomers(session, request, id);
    if (forbid) return forbid;

    const body = await request.json().catch(() => ({}));
    const parsed = banBodySchema.safeParse(body);
    const reason = parsed.success ? parsed.data.reason : undefined;

    const ban = await banClient(
      { customerId: id, reason },
      {
        id: session!.user.id,
        name: session!.user.name,
        email: session!.user.email,
      }
    );

    await logAuditAction({
      userId: session!.user.id,
      userEmail: session!.user.email ?? undefined,
      userName: session!.user.name ?? undefined,
      action: 'BAN_CLIENT',
      resource: 'customers',
      resourceId: id,
      details: { reason: ban.reason },
      req: { headers: { 'user-agent': request.headers.get('user-agent') || undefined } },
    });

    return NextResponse.json({ ban });
  } catch (error) {
    return handleApiError(error, request);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const forbid = await requireCanManageCustomers(session, request, id);
    if (forbid) return forbid;

    await unbanCustomer(id);

    await logAuditAction({
      userId: session!.user.id,
      userEmail: session!.user.email ?? undefined,
      userName: session!.user.name ?? undefined,
      action: 'UNBAN_CLIENT',
      resource: 'customers',
      resourceId: id,
      req: { headers: { 'user-agent': request.headers.get('user-agent') || undefined } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, request);
  }
}
