import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { handleApiError } from '@/lib/apiError';
import { requireCanManageCustomers } from '@/lib/api-rbac';
import { banClient, listBannedClients } from '@/lib/services/clientBanService';
import { logAuditAction } from '@/lib/services/auditLog';

export const dynamic = 'force-dynamic';

const createBanSchema = z.object({
  customerId: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  socialMediaName: z.string().optional(),
  reason: z.string().max(1000).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const forbid = await requireCanManageCustomers(session, request);
    if (forbid) return forbid;

    const bans = await listBannedClients();
    return NextResponse.json({ bans });
  } catch (error) {
    return handleApiError(error, request);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const forbid = await requireCanManageCustomers(session, request);
    if (forbid) return forbid;

    const body = await request.json();
    const parsed = createBanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ban = await banClient(parsed.data, {
      id: session!.user.id,
      name: session!.user.name,
      email: session!.user.email,
    });

    await logAuditAction({
      userId: session!.user.id,
      userEmail: session!.user.email ?? undefined,
      userName: session!.user.name ?? undefined,
      action: 'BAN_CLIENT',
      resource: 'customers',
      resourceId: ban.customerId || ban.id,
      details: {
        name: ban.name,
        email: ban.email,
        phone: ban.phone,
        socialMediaName: ban.socialMediaName,
        reason: ban.reason,
      },
      req: { headers: { 'user-agent': request.headers.get('user-agent') || undefined } },
    });

    return NextResponse.json({ ban }, { status: 201 });
  } catch (error) {
    return handleApiError(error, request);
  }
}
