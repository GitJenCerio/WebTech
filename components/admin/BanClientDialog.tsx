'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export type BanDialogMode = 'customer' | 'identifiers';

interface BanClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: BanDialogMode;
  customer?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    socialMediaName?: string;
  } | null;
  onBanned: () => void;
}

export default function BanClientDialog({
  open,
  onOpenChange,
  mode,
  customer,
  onBanned,
}: BanClientDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [socialMediaName, setSocialMediaName] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setReason('');
    setName(customer?.name ?? '');
    setEmail(customer?.email ?? '');
    setPhone(customer?.phone ?? '');
    setSocialMediaName(customer?.socialMediaName ?? '');
  }, [open, customer]);

  const canSubmit =
    mode === 'customer'
      ? Boolean(customer?.id)
      : Boolean(name.trim() || email.trim() || phone.trim() || socialMediaName.trim());

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const res =
        mode === 'customer' && customer?.id
          ? await fetch(`/api/customers/${customer.id}/ban`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: reason.trim() || undefined }),
            })
          : await fetch('/api/banned-clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: name.trim() || undefined,
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                socialMediaName: socialMediaName.trim() || undefined,
                reason: reason.trim() || undefined,
              }),
            });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to ban client');
      onBanned();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to ban client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(100%,36rem)] sm:max-w-xl flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{mode === 'customer' ? 'Ban client' : 'Ban by details'}</DialogTitle>
          <DialogDescription>
            {mode === 'customer'
              ? 'This client will not be able to book using their name, email, phone, or social media name.'
              : 'Anyone who books with a matching name, email, phone, or social media name will be blocked.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-3">
          {error && (
            <div className="brand-note-error text-sm" role="alert">
              {error}
            </div>
          )}

          {mode === 'customer' ? (
            <div className="text-sm text-[#3d342c] space-y-1 brand-panel-soft p-3">
              {customer?.name && <p><strong>Name:</strong> {customer.name}</p>}
              {customer?.email && <p><strong>Email:</strong> {customer.email}</p>}
              {customer?.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
              {customer?.socialMediaName && <p><strong>Social:</strong> {customer.socialMediaName}</p>}
            </div>
          ) : (
            <>
              <div>
                <label>Full name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="Full name" />
              </div>
              <div>
                <label>Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" placeholder="Email" />
              </div>
              <div>
                <label>Contact number</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9" placeholder="Phone" />
              </div>
              <div>
                <label>Social media name</label>
                <Input value={socialMediaName} onChange={(e) => setSocialMediaName(e.target.value)} className="h-9" placeholder="Facebook or Instagram name" />
              </div>
            </>
          )}

          <div>
            <label>Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="brand-field min-h-[80px]"
              placeholder="Why is this client banned?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleSubmit} disabled={saving || !canSubmit}>
            {saving ? 'Banning...' : 'Ban'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
