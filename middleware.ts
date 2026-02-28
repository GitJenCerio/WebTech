import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/** Security headers to add to all responses */
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

/** Paths that never require authentication */
const PUBLIC_PATHS = [
  '/',
  '/about',
  '/booking',
  '/pricing',
  '/faq',
  '/blog',
  '/privacy-policy',
  '/cookies-policy',
  '/russian-manicure',
  '/russian-pedicure',
  '/russian-manicure-manila',
];

function isPublicAdminPath(pathname: string): boolean {
  if (pathname === '/admin') return true;
  if (pathname === '/admin/forgot-password' || pathname.startsWith('/admin/forgot-password/')) return true;
  if (pathname === '/admin/reset-password' || pathname.startsWith('/admin/reset-password/')) return true;
  return false;
}

/** API routes that are always public (no auth required) */
function isPublicApiRoute(pathname: string, method: string): boolean {
  // NextAuth routes
  if (pathname.startsWith('/api/auth')) return true;

  // Public booking flow
  if (pathname === '/api/bookings' && method === 'POST') return true;
  if (pathname.startsWith('/api/bookings/upload-proof')) return true;
  // Client photo upload/remove - validated by route (token or session)
  if (pathname.match(/^\/api\/bookings\/[^/]+\/photos$/)) return true;

  // Public customer operations during booking
  if (pathname === '/api/customers' && method === 'POST') return true;
  if (pathname.startsWith('/api/customers/find')) return true;

  // Public availability and nail techs (booking page)
  if (pathname === '/api/availability' && method === 'GET') return true;
  if (pathname === '/api/nail-techs' && method === 'GET') return true;

  // Client photo upload - generate signature (no session, validated by route)
  if (pathname.startsWith('/api/integrations/storage/generate-signature')) return true;

  // Cron endpoints (use x-cron-secret header, validated by route)
  if (pathname.startsWith('/api/cron/')) return true;

  return false;
}

/** Check if path is an admin or API route that needs protection */
function requiresAuth(pathname: string, method: string): boolean {
  if (pathname.startsWith('/admin')) {
    if (isPublicAdminPath(pathname)) return false;
    return true;
  }

  if (pathname.startsWith('/api/')) {
    if (isPublicApiRoute(pathname, method)) return false;
    return true;
  }

  return false;
}

/** Apply security headers to a response */
function withSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Apply security headers to all responses (we'll clone and add to whatever we return)
  const addHeaders = (res: NextResponse) => withSecurityHeaders(res);

  // Static assets, _next, favicon - skip auth, add headers
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|webp|svg|css|js|woff2?)$/)
  ) {
    return addHeaders(NextResponse.next());
  }

  // Public marketing/content pages
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return addHeaders(NextResponse.next());
  }

  // Routes that don't require auth
  if (!requiresAuth(pathname, method)) {
    return addHeaders(NextResponse.next());
  }

  // Require authentication - validate JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return addHeaders(
        NextResponse.json(
          { error: 'Authentication required. Please log in.' },
          { status: 401 }
        )
      );
    }
    const loginUrl = new URL('/admin', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return addHeaders(NextResponse.redirect(loginUrl));
  }

  // Check token expiry (JWT exp is in seconds)
  const exp = token.exp as number | undefined;
  if (exp && Date.now() / 1000 > exp) {
    if (pathname.startsWith('/api/')) {
      return addHeaders(
        NextResponse.json(
          { error: 'Session expired. Please log in again.' },
          { status: 401 }
        )
      );
    }
    const loginUrl = new URL('/admin', request.url);
    loginUrl.searchParams.set('error', 'SessionExpired');
    return addHeaders(NextResponse.redirect(loginUrl));
  }

  // Check account status (isActive)
  const isActive = token.isActive as boolean | undefined;
  if (isActive === false) {
    if (pathname.startsWith('/api/')) {
      return addHeaders(
        NextResponse.json(
          { error: 'Account has been deactivated. Contact administrator.' },
          { status: 403 }
        )
      );
    }
    const loginUrl = new URL('/admin', request.url);
    loginUrl.searchParams.set('error', 'AccessDenied');
    return addHeaders(NextResponse.redirect(loginUrl));
  }

  return addHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
