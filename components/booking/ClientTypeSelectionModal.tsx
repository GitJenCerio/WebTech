'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Search, AlertCircle } from 'lucide-react';

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
  const [step, setStep] = useState<'type' | 'lookup' | 'location'>('type');
  const [clientType, setClientType] = useState<ClientType | null>(null);
  const [originalClientType, setOriginalClientType] = useState<ClientType | null>(null);
  const [phone, setPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    found: boolean;
    customer?: { id: string; name: string; phone: string; socialMediaName: string };
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

  const handleLocationSelect = (location: ServiceLocation) => {
    if (!clientType) return;

    const data: {
      clientType: ClientType;
      serviceLocation: ServiceLocation;
      customerId?: string;
      customerName?: string;
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
      data.contactNumber = lookupResult.customer.phone;
      data.socialMediaName = lookupResult.customer.socialMediaName;
    }

    onContinue(data);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-2 border-gray-300 rounded-xl max-w-md w-full p-6 sm:p-8 shadow-2xl my-4 max-h-[90vh] overflow-y-auto relative"
      >
        <h3 className="text-2xl font-semibold mb-2 pr-10 text-gray-900">Book Your Appointment</h3>

        {/* Step 1: Client Type Selection */}
        {step === 'type' && (
          <div>
            <p className="text-sm text-gray-600 mb-6">
              Are you a new client or a returning client?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleSelectClientType('new')}
                className="w-full text-left rounded-lg border-2 p-4 transition-all active:scale-[0.98] touch-manipulation border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md"
              >
                <p className="font-semibold text-base">New Client</p>
                <p className="text-xs sm:text-sm opacity-75 mt-1 text-gray-600">I&apos;m booking for the first time</p>
              </button>

              <button
                onClick={() => handleSelectClientType('repeat')}
                className="w-full text-left rounded-lg border-2 p-4 transition-all active:scale-[0.98] touch-manipulation border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md"
              >
                <p className="font-semibold text-base">Returning Client</p>
                <p className="text-xs sm:text-sm opacity-75 mt-1 text-gray-600">I&apos;ve booked before</p>
              </button>
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
                <label className="text-sm text-gray-700 font-medium mb-2 flex items-center gap-2 block">
                  <Phone className="w-4 h-4 text-gray-600" />
                  Contact Number
                </label>
                <div className="flex gap-2">
                  <input
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
                    className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-3 py-3 text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-400 hover:border-gray-400 transition-colors"
                    disabled={lookupLoading}
                  />
                  <button
                    onClick={handleLookup}
                    disabled={lookupLoading || !phone.trim()}
                    className="px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {lookupLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </button>
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
                  <button
                    onClick={() => setStep('location')}
                    className="w-full mt-3 px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all touch-manipulation text-sm"
                  >
                    Continue
                  </button>
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
                  <button
                    onClick={() => setStep('location')}
                    className="w-full mt-3 px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all touch-manipulation text-sm"
                  >
                    Continue as New Client
                  </button>
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
              <button
                onClick={() => handleLocationSelect('homebased_studio')}
                className="w-full text-left rounded-lg border-2 p-4 transition-all active:scale-[0.98] touch-manipulation border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md"
              >
                <p className="font-semibold text-base">Home Studio</p>
                <p className="text-xs sm:text-sm opacity-75 mt-1 text-gray-600">Service at our location</p>
              </button>

              <button
                onClick={() => handleLocationSelect('home_service')}
                className="w-full text-left rounded-lg border-2 p-4 transition-all active:scale-[0.98] touch-manipulation border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md"
              >
                <p className="font-semibold text-base">Home Service <span className="text-green-700 font-semibold">+₱1,000</span></p>
                <p className="text-xs sm:text-sm opacity-75 mt-1 text-gray-600">Service at your home</p>
              </button>
            </div>

            {error && (
              <div className="rounded-lg border-2 border-gray-300 bg-gray-50 px-4 py-3 mt-4">
                <p className="text-sm text-gray-800 font-medium">{error}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
