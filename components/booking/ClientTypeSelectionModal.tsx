'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';

type ClientType = 'new' | 'repeat';
type ServiceLocation = 'homebased_studio' | 'home_service';

interface ClientTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (data: {
    clientType: ClientType;
    serviceLocation: ServiceLocation;
    contactNumber?: string;
    socialMediaName?: string;
    customerId?: string;
    customerName?: string;
  }) => void;
}

export default function ClientTypeSelectionModal({
  isOpen,
  onClose,
  onContinue,
}: ClientTypeSelectionModalProps) {
  const [clientType, setClientType] = useState<ClientType | null>(null);
  const [serviceLocation, setServiceLocation] = useState<ServiceLocation | null>(null);
  const [contactNumber, setContactNumber] = useState('');
  const [socialMediaName, setSocialMediaName] = useState('');
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckRepeatClient = async () => {
    if (!contactNumber.trim()) {
      setError('Please enter your contact number');
      return;
    }

    setIsCheckingCustomer(true);
    setError(null);
    setFoundCustomer(null);

    try {
      const res = await fetch(`/api/customers/find?phone=${encodeURIComponent(contactNumber.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.customer) {
          setFoundCustomer({ id: data.customer.id, name: data.customer.name });
          setError(null);
        } else {
          setError('No record found with this contact number. You can proceed as a new client.');
        }
      } else {
        setError('Unable to verify. Please try again or proceed as a new client.');
      }
    } catch (error) {
      console.error('Error finding customer:', error);
      setError('Unable to verify. Please try again or proceed as a new client.');
    } finally {
      setIsCheckingCustomer(false);
    }
  };

  const handleContinue = () => {
    if (!serviceLocation) {
      setError('Please select service location');
      return;
    }

    if (clientType === 'new') {
      if (!socialMediaName.trim()) {
        setError('Please enter your Facebook or Instagram name');
        return;
      }
      if (!contactNumber.trim()) {
        setError('Please enter your contact number');
        return;
      }
      onContinue({
        clientType: 'new',
        serviceLocation,
        contactNumber: contactNumber.trim(),
        socialMediaName: socialMediaName.trim(),
      });
    } else if (clientType === 'repeat') {
      if (!foundCustomer) {
        setError('Please verify your contact number first');
        return;
      }
      onContinue({
        clientType: 'repeat',
        serviceLocation,
        contactNumber: contactNumber.trim(),
        customerId: foundCustomer.id,
        customerName: foundCustomer.name,
      });
    }
  };

  const handleReset = () => {
    setClientType(null);
    setServiceLocation(null);
    setContactNumber('');
    setSocialMediaName('');
    setFoundCustomer(null);
    setError(null);
    setIsCheckingCustomer(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-100 border-2 border-slate-300 rounded-lg max-w-md w-full p-4 sm:p-6 md:p-8 shadow-xl shadow-slate-900/20 my-4 max-h-[90vh] overflow-y-auto relative"
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
            handleReset();
          }}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-slate-200 active:bg-slate-300 transition-colors touch-manipulation z-10"
          aria-label="Close"
          type="button"
        >
          <IoClose className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
        </button>

        <h3 className="text-xl sm:text-2xl font-heading font-semibold mb-3 sm:mb-4 pr-8 sm:pr-10">
          Book Your Appointment
        </h3>

        {/* Step 1: Choose client type */}
        {!clientType ? (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-sm sm:text-base text-gray-700 mb-4">
              Are you a new client or a returning client?
            </p>
            
            <button
              onClick={() => {
                setClientType('new');
                setError(null);
              }}
              className="w-full px-4 py-3 sm:py-4 bg-white text-black font-medium border-2 border-black shadow-[0_0_0_2px_#000000] hover:bg-black hover:text-white hover:border hover:border-white hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] active:scale-[0.98] transition-all duration-300 touch-manipulation text-sm sm:text-base"
            >
              New Client
            </button>

            <button
              onClick={() => {
                setClientType('repeat');
                setError(null);
              }}
              className="w-full px-4 py-3 sm:py-4 bg-white text-black font-medium border-2 border-black shadow-[0_0_0_2px_#000000] hover:bg-black hover:text-white hover:border hover:border-white hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] active:scale-[0.98] transition-all duration-300 touch-manipulation text-sm sm:text-base"
            >
              Returning Client
            </button>
          </div>
        ) : !serviceLocation ? (
          /* Step 2: Choose service location */
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={handleReset}
              className="text-sm text-slate-600 hover:text-slate-900 underline mb-2"
            >
              ← Back
            </button>

            <p className="text-sm sm:text-base text-gray-700 mb-4">
              Where would you like the service?
            </p>
            
            <button
              onClick={() => {
                setServiceLocation('homebased_studio');
                setError(null);
              }}
              className="w-full px-4 py-3 sm:py-4 bg-white text-black font-medium border-2 border-black shadow-[0_0_0_2px_#000000] hover:bg-black hover:text-white hover:border hover:border-white hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] active:scale-[0.98] transition-all duration-300 touch-manipulation text-sm sm:text-base"
            >
              Home Studio
            </button>

            <button
              onClick={() => {
                setServiceLocation('home_service');
                setError(null);
              }}
              className="w-full px-4 py-3 sm:py-4 bg-white text-black font-medium border-2 border-black shadow-[0_0_0_2px_#000000] hover:bg-black hover:text-white hover:border hover:border-white hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] active:scale-[0.98] transition-all duration-300 touch-manipulation text-sm sm:text-base"
            >
              Home Service (+₱1,000)
            </button>

            {error && (
              <div className="rounded-xl sm:rounded-2xl border-2 border-red-300 bg-red-50 px-3 sm:px-4 py-2.5 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>
        ) : clientType === 'new' ? (
          /* Step 3a: New client details */
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => {
                setServiceLocation(null);
                setError(null);
              }}
              className="text-sm text-slate-600 hover:text-slate-900 underline mb-2"
            >
              ← Back
            </button>

            <p className="text-xs text-slate-500 mb-1">
              Service location: <span className="font-semibold">{serviceLocation === 'homebased_studio' ? 'Home Studio' : 'Home Service (+₱1,000)'}</span>
            </p>

            <div>
              <label className="text-sm sm:text-base text-gray-600 mb-1 block">
                Facebook or Instagram Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={socialMediaName}
                onChange={(e) => {
                  setSocialMediaName(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your FB or IG name"
                className="mt-1 w-full rounded-xl sm:rounded-2xl border-2 border-slate-300 bg-white px-3 py-3 sm:py-2 text-base sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-slate-400"
                required
              />
            </div>

            <div>
              <label className="text-sm sm:text-base text-gray-600 mb-1 block">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => {
                  setContactNumber(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your contact number"
                className="mt-1 w-full rounded-xl sm:rounded-2xl border-2 border-slate-300 bg-white px-3 py-3 sm:py-2 text-base sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-slate-400"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl sm:rounded-2xl border-2 border-red-300 bg-red-50 px-3 sm:px-4 py-2.5 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              onClick={handleContinue}
              className="w-full px-4 py-3 sm:py-2 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] active:scale-[0.98] transition-all duration-300 touch-manipulation text-sm sm:text-base"
            >
              Continue
            </button>
          </div>
        ) : (
          /* Step 3b: Repeat client details */
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => {
                  setServiceLocation(null);
                  setError(null);
                  setFoundCustomer(null);
                }}
                className="text-sm text-slate-600 hover:text-slate-900 underline"
              >
                ← Back
              </button>
              <span className="text-xs text-slate-500">
                {serviceLocation === 'homebased_studio' ? 'Home Studio' : 'Home Service'}
              </span>
            </div>

            <div>
              <label className="text-sm sm:text-base text-gray-600 mb-1 block">
                Contact Number Used in Previous Booking <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => {
                    setContactNumber(e.target.value);
                    setFoundCustomer(null);
                    setError(null);
                  }}
                  placeholder="Enter your contact number"
                  className="flex-1 mt-1 w-full rounded-xl sm:rounded-2xl border-2 border-slate-300 bg-white px-3 py-3 sm:py-2 text-base sm:text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                  type="button"
                  onClick={handleCheckRepeatClient}
                  disabled={!contactNumber.trim() || isCheckingCustomer}
                  className="mt-1 px-4 py-3 sm:py-2 text-base sm:text-base font-semibold text-white bg-slate-900 rounded-xl sm:rounded-2xl hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus:ring-2 focus:ring-slate-400 min-w-[100px]"
                >
                  {isCheckingCustomer ? 'Checking...' : 'Check'}
                </button>
              </div>
            </div>

            {foundCustomer && (
              <div className="mt-2 rounded-xl sm:rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-3 sm:px-4 py-2.5">
                <p className="text-[10px] sm:text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span>
                  Welcome back, <span className="font-semibold">{foundCustomer.name}</span>!
                </p>
              </div>
            )}

            {error && !foundCustomer && (
              <div className="rounded-xl sm:rounded-2xl border-2 border-amber-300 bg-amber-50 px-3 sm:px-4 py-2.5 text-sm text-amber-800">
                {error}
                <button
                  onClick={() => {
                    setClientType('new');
                    setError(null);
                  }}
                  className="mt-2 block text-sm underline font-semibold"
                >
                  Proceed as New Client
                </button>
              </div>
            )}

            <button
              onClick={handleContinue}
              disabled={!foundCustomer}
              className="w-full px-4 py-3 sm:py-2 bg-black text-white font-medium border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] active:scale-[0.98] transition-all duration-300 touch-manipulation text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
