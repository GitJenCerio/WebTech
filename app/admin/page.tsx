'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import './admin.css';

export const dynamic = 'force-dynamic';

function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const authError = searchParams.get('error');
  const oauthErrorMessage =
    authError === 'OAuthSignin' ? 'Google sign-in could not be started. Check GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.' :
    authError === 'OAuthCallback' ? 'Google sign-in failed during callback. Check NEXTAUTH_URL and Google OAuth redirect URI.' :
    authError === 'Configuration' ? 'Auth is not configured. Check NEXTAUTH_SECRET / NEXTAUTH_URL and provider env vars.' :
    authError === 'AccessDenied' ? 'Access denied. This account is not authorized. Only pre-approved users can access the admin panel. Please contact an administrator to add your account.' :
    authError ? `Sign-in error: ${authError}` :
    '';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
      } else {
        window.location.href = '/admin/overview';
        return;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');

    try {
      const result = await signIn('google', {
        callbackUrl: '/admin/overview',
        redirect: false,
      });

      if (result?.error) {
        setError(oauthErrorMessage || 'Failed to sign in with Google. Please try again.');
        setGoogleLoading(false);
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
        return;
      }

      await signIn('google', { callbackUrl: '/admin/overview' });
    } catch (error: any) {
      setError('Failed to sign in with Google. Please try again.');
      setGoogleLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="w-full max-w-md mx-auto px-4">
        <Card className="admin-login-card">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="Admin Login"
                width={180}
                height={60}
                className="mx-auto"
                priority
              />
            </div>
            <CardTitle className="text-xl font-bold text-[#1a1a1a]">Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@glammednailsbyjhen.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || googleLoading}
                  className="bg-[#f9f9f9] border-[#e5e5e5]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || googleLoading}
                  className="bg-[#f9f9f9] border-[#e5e5e5]"
                />
              </div>

              {(error || oauthErrorMessage) && (
                <div
                  className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  <i className="bi bi-exclamation-circle"></i>
                  <span>{error || oauthErrorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#1a1a1a] text-white hover:bg-[#2d2d2d]"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2 inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right mr-2"></i>
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <>
                  <span
                    className="animate-spin mr-2 inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                    aria-hidden
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 shrink-0"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="admin-login-page flex justify-center items-center min-h-screen">
        <span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" aria-label="Loading" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
