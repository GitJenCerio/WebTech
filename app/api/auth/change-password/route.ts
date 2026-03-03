import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { authOptions } from '@/lib/auth-options';
import { handleApiError, UnauthorizedError, NotFoundError, ValidationError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/change-password
 * Change password for authenticated user.
 * Body: { currentPassword, newPassword }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new UnauthorizedError();

    const body = await request.json();
    const changePasswordSchema = z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    });
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.flatten());
    }
    const { currentPassword, newPassword } = parsed.data;

    await connectDB();
    const user = await User.findById(session.user.id).select('+password');
    if (!user || !user.password) throw new NotFoundError('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return handleApiError(error, request);
  }
}
