'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Copy, Check } from 'lucide-react';

interface ResetPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    authMethod?: 'google' | 'password';
  } | null;
  onSuccess?: () => void;
}

export default function ResetPasswordDialog({
  open,
  onClose,
  user,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleReset = async () => {
    if (!user) return;
    if (user.authMethod === 'google') {
      setError('This user signs in with Google. Password reset is not applicable.');
      return;
    }
    setError('');
    setTempPassword('');
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      setTempPassword(data.temporaryPassword || '');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setTempPassword('');
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {user.authMethod === 'google' ? (
            <p className="text-sm text-gray-600">
              <strong>{user.name || user.email}</strong> signs in with Google. Password reset is not applicable.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Reset password for <strong>{user.name || user.email}</strong>. A temporary password will be generated. Share it securely with the user.
              </p>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              {tempPassword && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Temporary password (copy and share securely)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={tempPassword}
                      className="font-mono text-sm bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-amber-600">
                    This password will not be shown again. Ask the user to change it after signing in.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            {tempPassword ? 'Close' : 'Cancel'}
          </Button>
          {user.authMethod !== 'google' && !tempPassword && (
            <Button
              type="button"
              onClick={handleReset}
              disabled={loading}
              loading={loading}
            >
              Generate Temporary Password
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
