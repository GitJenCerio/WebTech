import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { sendInviteEmail } from '@/lib/email';
import { requireCanManageUsers } from '@/lib/api-rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const forbid = await requireCanManageUsers(session, request);
    if (forbid) return forbid;

    await connectDB();

    // Fetch all users from database
    const users = await User.find({}).sort({ createdAt: -1 });

    // Map users to response format
    const usersData = users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name || user.email.split('@')[0],
      authMethod: user.password ? 'password' : 'google',
      emailVerified: user.emailVerified || false,
      image: user.image || null,
      role: user.role || 'STAFF',
      assignedNailTechId: user.assignedNailTechId || null,
      status: user.status || 'active',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      users: usersData,
      count: usersData.length,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const forbid = await requireCanManageUsers(session, request);
    if (forbid) return forbid;

    const body = await request.json();
    const { email, password, name, authMethod, role: bodyRole, assignedNailTechId: bodyAssignedNailTechId } = body;
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'] as const;
    const role = validRoles.includes(bodyRole) ? bodyRole : 'STAFF';
    const assignedNailTechId = role === 'STAFF' ? (bodyAssignedNailTechId || null) : null;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (authMethod === 'password' && !password) {
      return NextResponse.json({ error: 'Password is required for password authentication' }, { status: 400 });
    }

    if (role === 'STAFF' && !assignedNailTechId) {
      return NextResponse.json({ error: 'Staff must be assigned to a nail tech' }, { status: 400 });
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user based on auth method
    if (authMethod === 'google') {
      // Create user for Google OAuth only (no password)
      const user = await User.create({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        emailVerified: true,
        role,
        assignedNailTechId: assignedNailTechId || undefined,
        status: 'active',
      });

      // Send invitation email for Google OAuth
      const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin`;
      let emailSent = false;
      let emailError: string | undefined;
      
      try {
        const emailResult = await sendInviteEmail({
          email: user.email,
          displayName: user.name || user.email.split('@')[0],
          resetLink: inviteLink,
          role: role,
        });
        emailSent = emailResult.success;
        emailError = emailResult.error;
      } catch (error: any) {
        console.error('Failed to send invitation email:', error);
        emailError = error.message || 'Unknown error';
      }

      // Check if Resend API is configured
      const hasEmailService = !!process.env.RESEND_API_KEY;
      
      return NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          authMethod: 'google',
        },
        message: emailSent 
          ? 'User created successfully. Invitation email sent.' 
          : hasEmailService
          ? `User created successfully. Email sending failed: ${emailError || 'Unknown error'}. Check server logs.`
          : 'User created successfully. Email service not configured - invitation link logged to console.',
        emailSent,
        inviteLink: !emailSent ? inviteLink : undefined, // Include link if email wasn't sent
        emailConfigured: hasEmailService,
      });
    } else {
      // Create user with password
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
        emailVerified: true,
        role,
        assignedNailTechId: assignedNailTechId || undefined,
        status: 'active',
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          authMethod: 'password',
        },
        message: 'User created successfully.',
      });
    }
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
