import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

jest.mock('next-auth/jwt', () => ({
  __esModule: true,
  getToken: jest.fn(),
}));

const { getToken } = require('next-auth/jwt') as { getToken: jest.Mock };

function makeReq(url: string, method = 'GET'): NextRequest {
  return {
    nextUrl: new URL(url),
    method,
    url,
    headers: new Headers(),
  } as any;
}

describe('security: middleware auth + headers', () => {
  beforeEach(() => {
    getToken.mockReset();
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret';
  });

  it('adds security headers to responses', async () => {
    getToken.mockResolvedValueOnce(null);
    const res = (await middleware(makeReq('http://localhost/admin'))) as NextResponse;
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });

  it('blocks protected API routes when no token (401)', async () => {
    getToken.mockResolvedValueOnce(null);
    const res = (await middleware(makeReq('http://localhost/api/users'))) as NextResponse;
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Authentication required/i);
  });

  it('redirects protected admin routes to /admin when no token', async () => {
    getToken.mockResolvedValueOnce(null);
    const res = (await middleware(makeReq('http://localhost/admin/settings'))) as NextResponse;
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toContain('/admin');
  });

  it('blocks deactivated accounts (403) on API routes', async () => {
    getToken.mockResolvedValueOnce({ isActive: false, exp: Math.floor(Date.now() / 1000) + 60 });
    const res = (await middleware(makeReq('http://localhost/api/users'))) as NextResponse;
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/deactivated/i);
  });
});

