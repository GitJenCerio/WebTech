import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * Get the current session on the server side
 * Use this in API routes and server components
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in API routes that require authentication
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  return session;
}
