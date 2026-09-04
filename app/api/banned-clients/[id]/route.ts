import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { handleApiError } from '@/lib/apiError';
import { requireCanManageCustomers } from '@/lib/api-rbac';
import { unbanClient } from '@/lib/services/clientBanService';
import { logAuditAction } from '@/lib/services/auditLog';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const forbid = await requireCanManageCustomers(session, request, id);
    if (forbid) return forbid;

    const ban = await unbanClient(id);

    await logAuditAction({
      userId: session!.user.id,
      userEmail: session!.user.email ?? undefined,
      userName: session!.user.name ?? undefined,
      action: 'UNBAN_CLIENT',
      resource: 'customers',
      resourceId: ban.customerId || ban.id,
      details: {
        name: ban.name,
        email: ban.email,
        phone: ban.phone,
        socialMediaName: ban.socialMediaName,
      },
      req: { headers: { 'user-agent': request.headers.get('user-agent') || undefined } },
    });

    return NextResponse.json({ ban });
  } catch (error) {
    return handleApiError(error, request);
  }
}
