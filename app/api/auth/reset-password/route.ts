import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import PasswordResetToken from '@/lib/models/PasswordResetToken';
import { handleApiError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/auth/reset-password
 * Reset password with token from forgot-password email.
 * Body: { token, newPassword }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse({
      token: typeof body?.token === 'string' ? body.token.trim() : '',
      newPassword: body?.newPassword ?? '',
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { token, newPassword } = parsed.data;

    await connectDB();

    const resetRecord = await PasswordResetToken.findOne({ token });
    if (!resetRecord) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    if (new Date() > resetRecord.expiresAt) {
      await PasswordResetToken.deleteOne({ token });
      return NextResponse.json({ error: 'Reset link has expired' }, { status: 400 });
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      await PasswordResetToken.deleteOne({ token });
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await PasswordResetToken.deleteOne({ token });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return handleApiError(error, request);
  }
}
