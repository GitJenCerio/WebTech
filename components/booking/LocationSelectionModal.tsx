'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { OverlayModal } from '@/components/ui/OverlayModal';
import { OptionCard, OptionCardTitle, OptionCardDescription } from '@/components/ui/OptionCard';
import { Button } from '@/components/ui/Button';

type ServiceLocation = 'homebased_studio' | 'home_service';

interface LocationSelectionModalProps {
  isOpen: boolean;
  onContinue: (location: ServiceLocation) => void;
  onBack: () => void;
}

export default function LocationSelectionModal({
  isOpen,
  onContinue,
  onBack,
}: LocationSelectionModalProps) {
  const [step, setStep] = useState<'location' | 'home_terms'>('location');

  useEffect(() => {
    if (isOpen) setStep('location');
  }, [isOpen]);

  const handleLocationSelect = (location: ServiceLocation) => {
    if (location === 'home_service') {
      setStep('home_terms');
      return;
    }
    onContinue(location);
  };

  return (
    <OverlayModal
      isOpen={isOpen}
      onClose={onBack}
      size="md"
      zIndex={50}
      closeButton={
        <button type="button" onClick={onBack} className="brand-icon-btn" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
      }
    >
      <div className="brand-modal-scroll brand-modal-body">
        <p className="brand-eyebrow mb-1 pr-9">Step 2 of 3</p>
        <h3 className="font-heading text-xl sm:text-2xl mb-2 text-[#1c1917] pr-9">
          {step === 'location' ? 'Where would you like the service?' : 'Home Service Areas & Fees'}
        </h3>
        <div className="brand-rule w-16 mb-4" aria-hidden />

        {step === 'location' && (
          <div className="space-y-3">
            <OptionCard selected={false} onClick={() => handleLocationSelect('homebased_studio')}>
              <OptionCardTitle>Home Studio</OptionCardTitle>
              <OptionCardDescription>Service at our location</OptionCardDescription>
            </OptionCard>
            <OptionCard selected={false} onClick={() => handleLocationSelect('home_service')}>
              <OptionCardTitle>Home Service</OptionCardTitle>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#3d342c] mt-1">₱1,500–₱3,000+ fee</p>
              <OptionCardDescription>
                Service at your home. Fee depends on location (Manila ₱1,500 · Metro Manila ₱2,000 · Outside Metro
                Manila or Group Bookings starts at ₱3,000, min. 3 clients). You&apos;ll review the full areas &amp; fees
                before continuing.
              </OptionCardDescription>
            </OptionCard>
          </div>
        )}

        {step === 'home_terms' && (
          <div>
            <button
              type="button"
              onClick={() => setStep('location')}
              className="brand-eyebrow mb-4 flex items-center gap-1.5 transition-colors hover:text-[#1c1917]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <p className="text-sm text-[#78716c] mb-4 leading-relaxed">
              Home service requires extra preparation, travel time, and transporting full equipment outside the studio.
              It also blocks several studio slots due to travel. Because of this, the rates were reviewed carefully and
              adjusted accordingly.
            </p>
            <div className="space-y-3">
              <div className="brand-panel-soft p-3">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <p className="font-heading text-lg text-[#1c1917]">Within Manila City</p>
                  <span className="text-sm text-[#1c1917] tabular-nums whitespace-nowrap">₱1,500</span>
                </div>
                <ul className="text-xs text-[#78716c] space-y-1 list-disc pl-4">
                  <li>Covers 1 client (single-client bookings)</li>
                  <li>+₱500 per additional client</li>
                  <li>Grab transport fee applies</li>
                </ul>
              </div>
              <div className="brand-panel-soft p-3">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <p className="font-heading text-lg text-[#1c1917]">Within Metro Manila</p>
                  <span className="text-sm text-[#1c1917] tabular-nums whitespace-nowrap">₱2,000</span>
                </div>
                <p className="text-[11px] text-[#a8a29e] mb-2 leading-relaxed">
                  Makati, Taguig, Pasig, Mandaluyong, Quezon City, San Juan, Marikina, Pasay, Parañaque, Las Piñas,
                  Muntinlupa, Caloocan, Valenzuela, Malabon, Navotas, Pateros
                </p>
                <ul className="text-xs text-[#78716c] space-y-1 list-disc pl-4">
                  <li>Covers 1 client (single-client bookings)</li>
                  <li>+₱500 per additional client</li>
                  <li>Grab transport fee applies</li>
                </ul>
              </div>
              <div className="brand-panel-soft p-3">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <p className="font-heading text-lg text-[#1c1917]">Outside Metro Manila or Group Bookings</p>
                  <span className="text-sm text-[#1c1917] tabular-nums whitespace-nowrap">From ₱3,000</span>
                </div>
                <p className="text-[11px] text-[#a8a29e] mb-2 leading-relaxed">
                  Luzon only — e.g. Bulacan, Rizal, Cavite, Laguna, Pampanga, Batangas · or group bookings (3+ clients)
                </p>
                <ul className="text-xs text-[#78716c] space-y-1 list-disc pl-4">
                  <li>Minimum of 3 clients required</li>
                  <li>Home service fee starts at ₱3,000</li>
                  <li>Grab transport fee applies</li>
                  <li>Message us for special arrangements</li>
                </ul>
              </div>
              <div className="brand-note-strong">
                <p className="brand-eyebrow mb-1.5">Service setup requirement</p>
                <p className="text-xs leading-relaxed">
                  Please ensure a table and chair are available at the location to allow proper service setup and
                  quality results.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {step === 'home_terms' && (
        <div className="brand-modal-footer">
          <Button variant="default" className="w-full" onClick={() => onContinue('home_service')}>
            I Agree &amp; Continue
          </Button>
        </div>
      )}
    </OverlayModal>
  );
}
