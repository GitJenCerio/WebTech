'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Script from 'next/script';
import './admin.css';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
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
        // Full page redirect so session cookie is read and layout sees authenticated state
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

      // Fallback: let NextAuth handle redirect
      await signIn('google', { callbackUrl: '/admin/overview' });
    } catch (error: any) {
      setError('Failed to sign in with Google. Please try again.');
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <div className="admin-login-page">
        <div className="container-fluid">
          <div className="row justify-content-center align-items-center min-vh-100">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card admin-login-card">
                <div className="card-body p-4 p-md-5">
                  <div className="text-center mb-4">
                    <div className="d-flex justify-content-center mb-4">
                      <Image
                        src="/logo.png"
                        alt="Admin Login"
                        width={180}
                        height={60}
                        className="mx-auto"
                        priority
                      />
                    </div>
                    <h1 className="h3 mb-2 fw-semibold">Admin Login</h1>
                    <p className="text-muted small mb-0">
                      Enter your credentials to access the dashboard
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="mt-4">
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-medium">
                        Email
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                          <i className="bi bi-envelope"></i>
                        </span>
                        <input
                          id="email"
                          type="email"
                          className="form-control border-start-0"
                          placeholder="admin@glammednailsbyjhen.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading || googleLoading}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="password" className="form-label fw-medium">
                        Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                          <i className="bi bi-lock"></i>
                        </span>
                        <input
                          id="password"
                          type="password"
                          className="form-control border-start-0"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading || googleLoading}
                        />
                      </div>
                    </div>

                    {(error || oauthErrorMessage) && (
                      <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                        <i className="bi bi-exclamation-circle me-2"></i>
                        <div>{error || oauthErrorMessage}</div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-dark w-100 mb-3"
                      disabled={loading || googleLoading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Sign In
                        </>
                      )}
                    </button>
                  </form>

                  <div className="divider my-4">
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1 border-top"></div>
                      <span className="px-3 text-muted small">Or continue with</span>
                      <div className="flex-grow-1 border-top"></div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    style={{
                      gap: '0.5rem',
                      padding: '0.75rem',
                      fontWeight: '500',
                    }}
                  >
                    {googleLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                          style={{ width: '1rem', height: '1rem' }}
                        ></span>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ flexShrink: 0 }}
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
                        <span>Sign in with Google</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
    </>
  );
}
