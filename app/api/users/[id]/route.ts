import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireCanManageUsers } from '@/lib/api-rbac';
import { handleApiError } from '@/lib/apiError';

const patchUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF']).optional(),
  assignedNailTechId: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const forbid = await requireCanManageUsers(session, request);
    if (forbid) return forbid;

    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = patchUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, role, assignedNailTechId, status } = parsed.data;

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update fields
    if (name !== undefined && name !== null && name !== '') {
      user.name = name;
    }
    if (role !== undefined) {
      const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'];
      user.role = validRoles.includes(role) ? role : user.role;
    }
    if (assignedNailTechId !== undefined) {
      user.assignedNailTechId = assignedNailTechId || null;
    }
    if (status !== undefined) {
      user.status = status;
    }

    await user.save();
    console.log('User updated successfully:', user._id.toString());

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        assignedNailTechId: user.assignedNailTechId || null,
        status: user.status,
        authMethod: user.password ? 'password' : 'google',
        emailVerified: user.emailVerified,
      },
      message: 'User updated successfully.',
    });
  } catch (error) {
    return handleApiError(error, request);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const forbid = await requireCanManageUsers(session, request);
    if (forbid) return forbid;

    await connectDB();
    const { id: userId } = await params;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    const activeAdmins = await User.countDocuments({
      role: { $in: adminRoles },
      status: 'active',
    });
    if (adminRoles.includes((user as any).role) && activeAdmins <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last active admin' }, { status: 400 });
    }

    // Soft delete
    await User.findByIdAndUpdate(userId, { status: 'inactive' });
    return NextResponse.json({ message: 'User deactivated successfully' });
  } catch (error) {
    return handleApiError(error, request);
  }
}
