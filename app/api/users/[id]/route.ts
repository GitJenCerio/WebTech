import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, role, assignedNailTechId, status } = body;

    console.log('Updating user:', { userId, body });

    await connectDB();

    // Find user
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
      user.role = role;
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
  } catch (error: any) {
    console.error('Error updating user:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;

    // Prevent deleting last active admin
    const activeAdmins = await User.countDocuments({ role: 'admin', status: 'active' });
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.role === 'admin' && activeAdmins <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last active admin' }, { status: 400 });
    }

    // Soft delete
    await User.findByIdAndUpdate(userId, { status: 'inactive' });
    return NextResponse.json({ message: 'User deactivated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
