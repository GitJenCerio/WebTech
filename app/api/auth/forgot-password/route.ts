import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import PasswordResetToken from '@/lib/models/PasswordResetToken';
import { sendPasswordResetEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Rate limit: 3 requests per hour per email (plan)
const forgotAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase();
  const now = Date.now();
  const entry = forgotAttempts.get(key);
  if (!entry) return true;
  if (now > entry.resetAt) {
    forgotAttempts.delete(key);
    return true;
  }
  return entry.count < RATE_LIMIT_MAX;
}

function recordAttempt(email: string): void {
  const key = email.toLowerCase();
  const now = Date.now();
  const entry = forgotAttempts.get(key);
  if (!entry) {
    forgotAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count++;
  }
}

/**
 * POST /api/auth/forgot-password
 * Request password reset email. Rate limited: 3/hour per email.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim?.();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    recordAttempt(email);

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    if (!user.password) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      userId: user._id,
      token,
      expiresAt,
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || '';
    const resetLink = `${baseUrl}/admin/reset-password?token=${encodeURIComponent(token)}`;

    const { success, error } = await sendPasswordResetEmail({
      email: user.email,
      displayName: user.name || user.email.split('@')[0],
      resetLink,
    });

    if (!success) {
      console.error('[forgot-password] Email failed:', error);
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
