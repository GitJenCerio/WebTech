import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import AuditLog from '@/lib/models/AuditLog';
import { requireCanViewAudit } from '@/lib/api-rbac';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const forbid = await requireCanViewAudit(session, request);
    if (forbid) return forbid;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const userId = searchParams.get('userId');

    await connectDB();

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (userId) query.userId = userId;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    const items = logs.map((log: Record<string, unknown>) => ({
      id: (log._id as { toString: () => string }).toString(),
      userId: log.userId,
      userEmail: log.userEmail,
      userName: log.userName,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: (log.createdAt as Date)?.toISOString?.() ?? null,
    }));

    return NextResponse.json({ items, total });
  } catch (error: unknown) {
    console.error('Audit log GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}
