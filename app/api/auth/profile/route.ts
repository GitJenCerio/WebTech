import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/auth/profile
 * Update authenticated user's profile (name, email).
 * Body: { name?, email? }
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body ?? {};

    const updates: Record<string, unknown> = {};

    if (typeof name === 'string' && name.trim()) {
      updates.name = name.trim();
    }

    if (typeof email === 'string' && email.trim()) {
      const normalized = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      await connectDB();
      const existing = await User.findOne({ email: normalized, _id: { $ne: session.user.id } });
      if (existing) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
      }
      updates.email = normalized;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updates },
      { new: true }
    )
      .select('-password -firebaseId')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: String(user._id),
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      assignedNailTechId: user.assignedNailTechId?.toString() ?? null,
      isActive: (user as any).status === 'active',
      lastLogin: (user as any).lastLogin?.toISOString?.() ?? null,
      createdAt: (user as any).createdAt?.toISOString?.() ?? null,
    });
  } catch (err) {
    console.error('[auth/profile]', err);
    return NextResponse.json(
      { error: 'An error occurred.' },
      { status: 500 }
    );
  }
}
