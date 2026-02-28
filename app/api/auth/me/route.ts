import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Get current authenticated user details.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
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
    console.error('[auth/me]', err);
    return NextResponse.json(
      { error: 'An error occurred.' },
      { status: 500 }
    );
  }
}
