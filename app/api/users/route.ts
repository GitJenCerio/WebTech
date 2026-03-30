import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { sendInviteEmail } from '@/lib/email';
import { requireCanManageUsers } from '@/lib/api-rbac';
import { handleApiError } from '@/lib/apiError';

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
  } catch (error) {
    return handleApiError(error, request);
  }
}

const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().optional(),
  name: z.string().optional(),
  authMethod: z.enum(['password', 'google']).default('google'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF']).default('STAFF'),
  assignedNailTechId: z.string().nullable().optional(),
}).refine((data) => {
  if (data.authMethod === 'password') return !!data.password;
  return true;
}, { message: 'Password is required for password authentication', path: ['password'] })
.refine((data) => {
  if (data.role === 'STAFF') return !!data.assignedNailTechId;
  return true;
}, { message: 'Staff must be assigned to a nail tech', path: ['assignedNailTechId'] });

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const forbid = await requireCanManageUsers(session, request);
    if (forbid) return forbid;

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, password, name, authMethod, role, assignedNailTechId } = parsed.data;

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
      // Create user with password (schema refine guarantees password when authMethod is 'password')
      if (!password) throw new Error('Password required');
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
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    return handleApiError(error, request);
  }
}
