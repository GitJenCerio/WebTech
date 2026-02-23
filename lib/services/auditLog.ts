import connectDB from '@/lib/mongodb';
import AuditLog from '@/lib/models/AuditLog';

export interface LogActionParams {
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  req?: { headers?: { 'x-forwarded-for'?: string; 'user-agent'?: string } };
}

/**
 * Log an audit action. Call from API routes after critical operations.
 * Does not throw - failures are logged to console only.
 */
export async function logAuditAction(params: LogActionParams): Promise<void> {
  try {
    await connectDB();
    const ip = params.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim();
    const userAgent = params.req?.headers?.['user-agent'];
    await AuditLog.create({
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      ipAddress: ip,
      userAgent: userAgent,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
