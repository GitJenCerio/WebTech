'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Phone, Search, AlertCircle, X } from 'lucide-react';
import { OverlayModal } from '@/components/ui/OverlayModal';
import { OptionCard, OptionCardTitle, OptionCardDescription } from '@/components/ui/OptionCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { CLIENT_BAN_PUBLIC_MESSAGE } from '@/lib/utils/clientBan';

type ClientType = 'new' | 'repeat';

interface ClientTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (data: {
    clientType: ClientType;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    contactNumber?: string;
    socialMediaName?: string;
  }) => void;
}

export default function ClientTypeSelectionModal({
  isOpen,
  onClose,
  onContinue,
}: ClientTypeSelectionModalProps) {
  const [step, setStep] = useState<'type' | 'lookup'>('type');
  const [phone, setPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [foundCustomer, setFoundCustomer] = useState<{
    id?: string;
    _id?: string;
    name: string;
    email?: string;
    phone: string;
    socialMediaName?: string;
  } | null>(null);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep('type');
    setPhone('');
    setLookupError(null);
    setFoundCustomer(null);
    setLookupLoading(false);
    setLookupAttempted(false);
  }, [isOpen]);

  const handleTypeSelect = (type: ClientType) => {
    if (type === 'repeat') {
      setStep('lookup');
      setLookupError(null);
      setFoundCustomer(null);
      setPhone('');
      return;
    }
    onContinue({ clientType: 'new' });
  };

  const handleLookup = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setLookupError('Please enter a valid 10 or 11-digit phone number.');
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setFoundCustomer(null);
    setLookupAttempted(false);
    try {
      const res = await fetch(`/api/customers/find?phone=${encodeURIComponent(digits)}`);
      const data = await res.json();
      if (data?.banned) {
        setLookupError(data.error || CLIENT_BAN_PUBLIC_MESSAGE);
        return;
      }
      if (data.found && data.customer) {
        const customerId = data.customer.id || data.customer._id;
        if (!customerId) {
          setFoundCustomer(null);
        } else {
          setFoundCustomer({ ...data.customer, id: customerId, _id: customerId });
        }
      } else {
        setLookupError(null);
        setFoundCustomer(null);
      }
    } catch {
      setLookupError('Something went wrong. Please try again.');
    } finally {
      setLookupLoading(false);
      setLookupAttempted(true);
    }
  };

  const continueAsNew = () => {
    onContinue({
      clientType: 'new',
      contactNumber: phone.replace(/\D/g, '') || undefined,
    });
  };

  return (
    <OverlayModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      zIndex={80}
      closeButton={
        <button type="button" onClick={onClose} className="brand-icon-btn" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      }
    >
      <div className="brand-modal-scroll brand-modal-body">
        {step === 'type' && (
          <>
            <p className="brand-eyebrow mb-1 pr-9">Almost there</p>
            <h3 className="font-heading text-xl sm:text-2xl mb-2 text-[#1c1917] pr-9">Are you a new or returning client?</h3>
            <div className="brand-rule w-16 mb-4" aria-hidden />
            <div className="space-y-3">
              <OptionCard selected={false} onClick={() => handleTypeSelect('new')}>
                <OptionCardTitle>New Client</OptionCardTitle>
                <OptionCardDescription>First time booking with us</OptionCardDescription>
              </OptionCard>
              <OptionCard selected={false} onClick={() => handleTypeSelect('repeat')}>
                <OptionCardTitle>Returning Client</OptionCardTitle>
                <OptionCardDescription>I&apos;ve booked with us before</OptionCardDescription>
              </OptionCard>
            </div>
          </>
        )}

        {step === 'lookup' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setStep('type');
                setLookupError(null);
                setFoundCustomer(null);
              }}
              className="brand-eyebrow mb-4 flex items-center gap-1.5 transition-colors hover:text-[#1c1917]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <h3 className="font-heading text-xl sm:text-2xl mb-1 text-[#1c1917]">Find your profile</h3>
            <p className="text-sm text-[#78716c] mb-5">Enter the phone number you used last time.</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="lookup-phone" className="text-xs text-[#78716c] uppercase tracking-wider">
                  Phone number
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e]" />
                  <Input
                    id="lookup-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="09XX XXX XXXX"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setLookupError(null);
                      setFoundCustomer(null);
                      setLookupAttempted(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLookup();
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                variant="default"
                className="w-full"
                onClick={handleLookup}
                disabled={lookupLoading || phone.replace(/\D/g, '').length < 10}
              >
                {lookupLoading ? (
                  'Searching…'
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Look up
                  </>
                )}
              </Button>
              {lookupError && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{lookupError}</p>
                </div>
              )}
              {foundCustomer && (
                <div className="brand-panel-soft p-4 space-y-3">
                  <p className="text-sm text-[#1c1917]">
                    We found <span className="font-medium">{foundCustomer.name}</span>
                    {foundCustomer.socialMediaName ? ` (@${foundCustomer.socialMediaName})` : ''}.
                  </p>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() =>
                      onContinue({
                        clientType: 'repeat',
                        customerId: foundCustomer.id || foundCustomer._id,
                        customerName: foundCustomer.name,
                        customerEmail: foundCustomer.email,
                        contactNumber: foundCustomer.phone,
                        socialMediaName: foundCustomer.socialMediaName,
                      })
                    }
                  >
                    Continue as {foundCustomer.name.split(' ')[0]}
                  </Button>
                </div>
              )}
              {!lookupLoading && lookupAttempted && !foundCustomer && !lookupError && (
                <div className="brand-note p-3 space-y-3">
                  <p className="text-sm text-[#78716c]">No matching profile found. Continue as a new client?</p>
                  <Button variant="outline" className="w-full" onClick={continueAsNew}>
                    Continue as new client
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </OverlayModal>
  );
}
