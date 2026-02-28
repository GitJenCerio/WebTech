'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import '../admin.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="w-full max-w-md mx-auto px-4">
        <Card className="admin-login-card">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Admin" width={180} height={60} className="mx-auto" priority />
            </div>
            <CardTitle className="text-xl font-bold text-[#1a1a1a]">Forgot password</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  Check your email for a password reset link. The link expires in 1 hour.
                </div>
                <Link href="/admin">
                  <Button type="button" variant="outline" className="w-full">
                    Back to login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>

                <Link href="/admin" className="block text-center text-sm text-muted-foreground hover:underline">
                  Back to login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
