import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';

interface AddUserModalProps {
  show: boolean;
  onHide: () => void;
  onUserAdded: () => void;
}

type AuthMethod = 'google' | 'password';

export default function AddUserModal({ show, onHide, onUserAdded }: AddUserModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('google');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (authMethod === 'password') {
      if (!password) {
        setError('Password is required');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          password: authMethod === 'password' ? password : undefined,
          authMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create user');
        setLoading(false);
        return;
      }

      // Show appropriate success message
      if (data.emailSent) {
        setSuccess(data.message || 'User created successfully! Invitation email sent.');
      } else if (data.inviteLink) {
        // Email service not configured - show link
        setSuccess(
          `User created! Email service not configured. Invitation link: ${data.inviteLink}`
        );
      } else {
        setSuccess(data.message || 'User created successfully!');
      }
      
      // Reset form
      setEmail('');
      setName('');
      setPassword('');
      setConfirmPassword('');
      setAuthMethod('google');

      // Notify parent and close modal after a delay
      setTimeout(() => {
        onUserAdded();
        onHide();
        setSuccess('');
      }, data.inviteLink ? 5000 : 1500); // Longer delay if showing link
    } catch (error: any) {
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setName('');
      setPassword('');
      setConfirmPassword('');
      setAuthMethod('google');
      setError('');
      setSuccess('');
      onHide();
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="authMethod">
                Authentication Method <span className="text-red-500">*</span>
              </Label>
              <Select
                value={authMethod}
                onValueChange={(value) => {
                  setAuthMethod(value as AuthMethod);
                  setPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                disabled={loading}
              >
                <SelectTrigger id="authMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google OAuth (Email Invite)</SelectItem>
                  <SelectItem value="password">Email & Password</SelectItem>
                </SelectContent>
              </Select>
              <small className="text-gray-500 text-xs block">
                {authMethod === 'google'
                  ? 'User will receive an email invitation to sign in with Google'
                  : 'User will sign in with email and password'}
              </small>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-gray-500 text-xs">(Optional)</span>
              </Label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User's full name"
                disabled={loading}
              />
            </div>

            {authMethod === 'password' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {authMethod === 'google' && (
              <Alert variant="info">
                <AlertDescription>
                  <strong>Google OAuth:</strong> User will receive an invitation email and can sign in with their Google account.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              loading={loading}
            >
              {authMethod === 'google' ? 'Send Invite' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
