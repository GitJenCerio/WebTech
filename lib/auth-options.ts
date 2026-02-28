import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

// In-memory rate limit: 5 attempts per minute per IP (plan: 5/min on login)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);
  if (!entry) return true;
  if (now > entry.resetAt) {
    loginAttempts.delete(identifier);
    return true;
  }
  return entry.count < RATE_LIMIT_MAX;
}

function recordLoginAttempt(identifier: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);
  if (!entry) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count++;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const key = credentials.email.toLowerCase().trim();

        if (!checkLoginRateLimit(key)) {
          console.warn(`[Auth] Rate limit exceeded for: ${key}`);
          return null;
        }

        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email }).select('+password');

          if (!user || !user.password) {
            recordLoginAttempt(key);
            return null;
          }

          if (user.status === 'inactive') {
            recordLoginAttempt(key);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            recordLoginAttempt(key);
            return null;
          }

          user.lastLogin = new Date();
          await user.save();

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image,
            role: user.role,
            assignedNailTechId: user.assignedNailTechId?.toString() || null,
            isActive: user.status === 'active',
          } as any;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Validate user email exists
        if (!user.email) {
          console.error('Google sign-in failed: No email provided');
          return false;
        }

        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });

          // RESTRICTED ACCESS: Only allow sign-in if user already exists in database
          if (!existingUser) {
            console.warn(`🚫 Access denied: User ${user.email} is not authorized. User must be added to the database first.`);
            return false; // Deny access - user must be pre-approved
          }

          if (existingUser.status === 'inactive') {
            console.warn(`🚫 Access denied: User ${user.email} account is deactivated.`);
            return false;
          }

          existingUser.lastLogin = new Date();

          // User exists - update their profile information
          if (!existingUser.emailVerified) {
            existingUser.emailVerified = true;
          }
          if (user.image && user.image !== existingUser.image) {
            existingUser.image = user.image;
          }
          if (user.name && user.name !== existingUser.name) {
            existingUser.name = user.name;
          }
          await existingUser.save();
          console.log(`✅ Authorized user signed in via Google: ${user.email}`);
        } catch (error: any) {
          console.error('❌ Error in Google sign-in callback:', error);
          console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code,
            email: user.email,
          });
          
          // Check for MongoDB connection errors
          const isConnectionError = 
            error.message?.includes('connection') || 
            error.message?.includes('timeout') ||
            error.message?.includes('MongooseServerSelectionError') ||
            error.message?.includes('whitelist') ||
            error.name === 'MongooseServerSelectionError';
          
          if (isConnectionError) {
            console.error('❌ Database connection issue - cannot verify user authorization');
            // Deny access if we can't verify the user exists
            return false;
          }
          
          // For other errors, deny access to be safe
          console.error('❌ Error verifying user authorization');
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.assignedNailTechId = token.assignedNailTechId ?? null;
        session.user.isActive = token.isActive ?? true;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        if ('role' in user && user.role) token.role = user.role;
        if ('assignedNailTechId' in user) token.assignedNailTechId = user.assignedNailTechId ?? null;
        if ('isActive' in user) token.isActive = Boolean(user.isActive ?? true);
        // For Google OAuth, user won't have role/assignedNailTechId - fetch from DB
        if (user.email && !token.role) {
          try {
            await connectDB();
            const dbUser = await User.findOne({ email: user.email }).select('role assignedNailTechId status');
            if (dbUser) {
              token.sub = dbUser._id.toString();
              token.role = dbUser.role;
              token.assignedNailTechId = dbUser.assignedNailTechId?.toString() || null;
              token.isActive = (dbUser as any).status === 'active';
            }
          } catch (e) {
            console.error('JWT: Failed to fetch user role', e);
          }
        }
      }
      return token;
    },
  },
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (plan: reduce from 30 days)
  },
  // NextAuth uses httpOnly cookies by default; maxAge controlled by session.maxAge
  secret: process.env.NEXTAUTH_SECRET,
};
