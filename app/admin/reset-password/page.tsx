'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import '../admin.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset link. Please request a new one.');
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/admin'), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="admin-login-page">
        <div className="w-full max-w-md mx-auto px-4">
          <Card className="admin-login-card">
            <CardContent className="pt-6">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Invalid or missing reset link. Please request a new one from the{' '}
                <Link href="/admin/forgot-password" className="underline font-medium">forgot password</Link> page.
              </div>
              <Link href="/admin" className="mt-4 block">
                <Button type="button" variant="outline" className="w-full mt-4">
                  Back to login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="admin-login-page">
        <div className="w-full max-w-md mx-auto px-4">
          <Card className="admin-login-card">
            <CardContent className="pt-6">
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                Password updated successfully. Redirecting to login...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="w-full max-w-md mx-auto px-4">
        <Card className="admin-login-card">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Admin" width={180} height={60} className="mx-auto" priority />
            </div>
            <CardTitle className="text-xl font-bold text-[#1a1a1a]">Reset password</CardTitle>
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="bg-[#f9f9f9] border-[#e5e5e5]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="bg-[#f9f9f9] border-[#e5e5e5]"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#1a1a1a] text-white hover:bg-[#2d2d2d]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2 inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                    Updating...
                  </>
                ) : (
                  'Reset password'
                )}
              </Button>

              <Link href="/admin" className="block text-center text-sm text-muted-foreground hover:underline">
                Back to login
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="admin-login-page flex justify-center items-center min-h-screen">
        <span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" aria-label="Loading" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
