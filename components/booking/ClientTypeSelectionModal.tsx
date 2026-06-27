'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Search, AlertCircle, X } from 'lucide-react';
import { OverlayModal } from '@/components/ui/OverlayModal';
import { OptionCard, OptionCardTitle, OptionCardDescription } from '@/components/ui/OptionCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

type ClientType = 'new' | 'repeat';
type ServiceLocation = 'homebased_studio' | 'home_service';

interface ClientTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (data: {
    clientType: ClientType;
    serviceLocation: ServiceLocation;
    customerId?: string;
    customerName?: string;
    contactNumber?: string;
    socialMediaName?: string;
  }) => void;
}

export default function ClientTypeSelectionModal({
  isOpen,
  onClose,
  onContinue,
}: ClientTypeSelectionModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'type' | 'lookup' | 'location' | 'home_terms'>('type');
  const [clientType, setClientType] = useState<ClientType | null>(null);
  const [originalClientType, setOriginalClientType] = useState<ClientType | null>(null);
  const [phone, setPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    found: boolean;
    customer?: { id: string; name: string; email: string; phone: string; socialMediaName: string };
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('type');
    setClientType(null);
    setOriginalClientType(null);
    setPhone('');
    setLookupResult(null);
    setLookupError(null);
    setError(null);
  };

  const handleSelectClientType = (type: ClientType) => {
    setClientType(type);
    setOriginalClientType(type);
    setError(null);
    if (type === 'repeat') {
      setStep('lookup');
    } else {
      setStep('location');
    }
  };

  const handleLookup = async () => {
    if (!phone.trim()) {
      setLookupError('Please enter your contact number');
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const response = await fetch(`/api/customers/find?phone=${encodeURIComponent(phone.trim())}`);
      const data = await response.json();

      if (data.found && data.customer) {
        setLookupResult({
          found: true,
          customer: {
            id: data.customer.id,
            name: data.customer.name,
            email: data.customer.email || '',
            phone: data.customer.phone || phone.trim(),
            socialMediaName: data.customer.socialMediaName || '',
          },
        });
      } else {
        setLookupResult({ found: false });
        // Not found - will proceed as new client
        setClientType('new');
      }
    } catch (err) {
      setLookupError('Unable to look up your account. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    router.push('/');
  };

  const handleLocationSelect = (location: ServiceLocation) => {
    if (!clientType) return;

    // Home Service requires the client to review and agree to the areas & fees first
    if (location === 'home_service') {
      setError(null);
      setStep('home_terms');
      return;
    }

    proceedWithLocation(location);
  };

  const proceedWithLocation = (location: ServiceLocation) => {
    if (!clientType) return;

    const data: {
      clientType: ClientType;
      serviceLocation: ServiceLocation;
      customerId?: string;
      customerName?: string;
      customerEmail?: string;
      contactNumber?: string;
      socialMediaName?: string;
    } = {
      clientType,
      serviceLocation: location,
    };

    // If repeat client was found, pass their info
    if (lookupResult?.found && lookupResult.customer) {
      data.customerId = lookupResult.customer.id;
      data.customerName = lookupResult.customer.name;
      data.customerEmail = lookupResult.customer.email;
      data.contactNumber = lookupResult.customer.phone;
      data.socialMediaName = lookupResult.customer.socialMediaName;
    }

    onContinue(data);
  };

  return (
    <OverlayModal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      zIndex={50}
      closeButton={
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Close and return to homepage"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>
      }
    >
      <div className="p-6 sm:p-8">
        <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-900">Book Your Appointment</h3>

        {/* Step 1: Client Type Selection */}
        {step === 'type' && (
          <div>
            <p className="text-sm text-gray-600 mb-6">
              Are you a new client or a returning client?
            </p>

            <div className="space-y-3">
              <div className="w-full grid place-items-center">
                <OptionCard className="w-[300px] max-w-full" selected={false} onClick={() => handleSelectClientType('new')}>
                  <OptionCardTitle>New Client</OptionCardTitle>
                  <OptionCardDescription>I&apos;m booking for the first time</OptionCardDescription>
                </OptionCard>
              </div>

              <div className="w-full grid place-items-center">
                <OptionCard className="w-[300px] max-w-full" selected={false} onClick={() => handleSelectClientType('repeat')}>
                  <OptionCardTitle>Returning Client</OptionCardTitle>
                  <OptionCardDescription>I&apos;ve booked before</OptionCardDescription>
                </OptionCard>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Phone Lookup (Repeat clients only) */}
        {step === 'lookup' && (
          <div>
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-900 underline mb-6 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <p className="text-sm text-gray-600 mb-4">
              Enter your contact number so we can find your account.
            </p>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  Contact Number
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setLookupError(null);
                      setLookupResult(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLookup();
                      }
                    }}
                    placeholder="e.g., 09123456789"
                    className="flex-1"
                    disabled={lookupLoading}
                  />
                  <Button
                    variant="default"
                    onClick={handleLookup}
                    disabled={lookupLoading || !phone.trim()}
                    className="px-4 py-3"
                  >
                    {lookupLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Lookup Error */}
              {lookupError && (
                <div className="rounded-lg border-2 border-gray-300 bg-gray-50 px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-800 font-medium">{lookupError}</p>
                </div>
              )}

              {/* Lookup Result - Found */}
              {lookupResult?.found && lookupResult.customer && (
                <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4 space-y-2">
                  <p className="text-sm font-semibold text-green-800">
                    Welcome back, {lookupResult.customer.name}!
                  </p>
                  <p className="text-xs text-green-700">
                    We found your account. Click continue to proceed with your booking.
                  </p>
                  <Button variant="default" className="w-full mt-3" onClick={() => setStep('location')}>
                    Continue
                  </Button>
                </div>
              )}

              {/* Lookup Result - Not Found */}
              {lookupResult && !lookupResult.found && (
                <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4 space-y-2">
                  <p className="text-sm font-semibold text-yellow-800">
                    Account not found
                  </p>
                  <p className="text-xs text-yellow-700">
                    We couldn&apos;t find an account with that number. You&apos;ll be booked as a new client.
                  </p>
                  <Button variant="default" className="w-full mt-3" onClick={() => setStep('location')}>
                    Continue as New Client
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Location Selection */}
        {step === 'location' && (
          <div>
            <button
              onClick={() => {
                if (originalClientType === 'repeat') {
                  setStep('lookup');
                  setLookupResult(null);
                  setLookupError(null);
                  setClientType('repeat');
                } else {
                  handleReset();
                }
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline mb-6 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <p className="text-sm text-gray-600 mb-6">
              Where would you like the service?
            </p>

            <div className="space-y-3">
              <div className="w-full grid place-items-center">
                <OptionCard className="w-[300px] max-w-full" selected={false} onClick={() => handleLocationSelect('homebased_studio')}>
                  <OptionCardTitle>Home Studio</OptionCardTitle>
                  <OptionCardDescription>Service at our location</OptionCardDescription>
                </OptionCard>
              </div>

              <div className="w-full grid place-items-center">
                <OptionCard className="w-[300px] max-w-full" selected={false} onClick={() => handleLocationSelect('home_service')}>
                  <OptionCardTitle>Home Service <span className="text-green-700 font-semibold">₱1,500–₱3,000 fee</span></OptionCardTitle>
                  <OptionCardDescription>
                    Service at your home. Fee depends on location (Manila ₱1,500 · Metro Manila ₱2,000 · Outside Metro Manila ₱3,000) on top of the service. You&apos;ll review the full areas &amp; fees before continuing.
                  </OptionCardDescription>
                </OptionCard>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border-2 border-gray-300 bg-gray-50 px-4 py-3 mt-4">
                <p className="text-sm text-gray-800 font-medium">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Home Service Areas & Fees Agreement */}
        {step === 'home_terms' && (
          <div>
            <button
              onClick={() => setStep('location')}
              className="text-sm text-gray-600 hover:text-gray-900 underline mb-4 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <h4 className="text-lg font-semibold text-gray-900 mb-1">Home Service Areas &amp; Fees</h4>
            <p className="text-sm text-gray-600 mb-4">
              Home service requires extra preparation, travel time, and transporting full equipment outside the studio.
              It also blocks several studio slots due to travel. Because of this, the rates were reviewed carefully and
              adjusted accordingly.
            </p>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {/* Within Manila City */}
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-gray-900">Within Manila City</p>
                  <span className="text-sm font-bold text-green-700 whitespace-nowrap">₱1,500 Fee</span>
                </div>
                <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                  <li>Covers 1 client (single-client bookings)</li>
                  <li>+₱500 per additional client</li>
                  <li>Grab transport fee applies</li>
                </ul>
              </div>

              {/* Within Metro Manila */}
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">Within Metro Manila</p>
                  <span className="text-sm font-bold text-green-700 whitespace-nowrap">₱2,000 Fee</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  Makati, Taguig, Pasig, Mandaluyong, Quezon City, San Juan, Marikina, Pasay, Parañaque, Las Piñas,
                  Muntinlupa, Caloocan, Valenzuela, Malabon, Navotas, Pateros
                </p>
                <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                  <li>Covers 1 client (single-client bookings)</li>
                  <li>+₱500 per additional client</li>
                  <li>Grab transport fee applies</li>
                </ul>
              </div>

              {/* Outside Metro Manila */}
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">Outside Metro Manila (Luzon only)</p>
                  <span className="text-sm font-bold text-green-700 whitespace-nowrap">₱3,000 Fee</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  e.g. Bulacan, Rizal, Cavite, Laguna, Pampanga, Batangas
                </p>
                <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                  <li>Covers 1 client (single-client bookings)</li>
                  <li>Mani &amp; Pedi package required</li>
                  <li>+₱500 per additional client</li>
                  <li>Grab transport fee applies</li>
                </ul>
              </div>

              {/* Setup requirement */}
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900 mb-1">Service Setup Requirement</p>
                <p className="text-xs text-amber-800">
                  Please ensure a table and chair are available at the location to allow proper service setup and
                  quality results.
                </p>
              </div>
            </div>

            <Button variant="default" className="w-full mt-5" onClick={() => proceedWithLocation('home_service')}>
              I Agree &amp; Continue
            </Button>
          </div>
        )}
      </div>
    </OverlayModal>
  );
}
