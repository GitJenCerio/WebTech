import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import PasswordResetToken from '@/lib/models/PasswordResetToken';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/reset-password
 * Reset password with token from forgot-password email.
 * Body: { token, newPassword }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token?.trim?.();
    const newPassword = body?.newPassword;

    if (!token || !newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

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
  } catch (err) {
    console.error('[reset-password]', err);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
