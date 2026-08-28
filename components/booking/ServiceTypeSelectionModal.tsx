'use client';

import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { OverlayModal } from '@/components/ui/OverlayModal';
import { OptionCard, OptionCardTitle, OptionCardDescription, OptionCardBadge } from '@/components/ui/OptionCard';
import { Button } from '@/components/ui/Button';
import { MANI_PEDI_EXPRESS_FEE, formatPeso } from '@/lib/constants/policy';

type ServiceLocation = 'homebased_studio' | 'home_service';
type BookingServiceType =
  | 'manicure'
  | 'pedicure'
  | 'mani_pedi'
  | 'mani_pedi_simultaneous'
  | 'home_service_2slots'
  | 'home_service_3slots';

interface ServiceOption {
  value: BookingServiceType;
  label: string;
  description: string;
  slots: number;
}

const EXPRESS_DESCRIPTION = `Manicure and pedicure with 2 nail techs at the same time (+${formatPeso(
  MANI_PEDI_EXPRESS_FEE
)} additional fee)`;

const servicesByLocation: Record<ServiceLocation, ServiceOption[]> = {
  homebased_studio: [
    { value: 'manicure', label: 'Manicure', description: 'Professional manicure at our studio', slots: 1 },
    { value: 'pedicure', label: 'Pedicure', description: 'Professional pedicure at our studio', slots: 1 },
    { value: 'mani_pedi', label: 'Mani + Pedi Combo', description: 'Manicure and pedicure combo', slots: 2 },
    { value: 'mani_pedi_simultaneous', label: 'Mani + Pedi Express', description: EXPRESS_DESCRIPTION, slots: 1 },
  ],
  home_service: [
    { value: 'manicure', label: 'Manicure', description: 'Professional manicure at your home', slots: 1 },
    { value: 'pedicure', label: 'Pedicure', description: 'Professional pedicure at your home', slots: 1 },
    { value: 'mani_pedi', label: 'Mani + Pedi Combo', description: 'Manicure and pedicure combo', slots: 2 },
    { value: 'mani_pedi_simultaneous', label: 'Mani + Pedi Express', description: EXPRESS_DESCRIPTION, slots: 1 },
  ],
};

interface ServiceTypeSelectionModalProps {
  isOpen: boolean;
  serviceLocation: ServiceLocation;
  selectedService: BookingServiceType | null;
  onContinue: (serviceType: BookingServiceType) => void;
  onBack: () => void;
}

export default function ServiceTypeSelectionModal({
  isOpen,
  serviceLocation,
  selectedService,
  onContinue,
  onBack,
}: ServiceTypeSelectionModalProps) {
  const services = servicesByLocation[serviceLocation];
  const [localSelectedService, setLocalSelectedService] = useState<BookingServiceType | null>(selectedService);

  const normalizeServiceValue = (value: BookingServiceType | string): BookingServiceType | null => {
    if (value === 'Russian Manicure') return 'manicure';
    if (value === 'Russian Manicure w/o Extensions') return 'manicure';
    if (value === 'Russian Manicure w/ Extensions') return 'manicure';
    return (value as BookingServiceType) || null;
  };

  const handleContinue = () => {
    if (!localSelectedService) return;
    onContinue(localSelectedService);
  };

  // Keep local selection in sync when modal opens or parent value changes.
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedService(selectedService);
    }
  }, [isOpen, selectedService]);

  return (
    <OverlayModal
      isOpen={isOpen}
      onClose={onBack}
      size="md"
      zIndex={50}
      closeButton={
        <button
          onClick={onBack}
          className="brand-icon-btn"
          aria-label="Back"
          type="button"
        >
          <IoClose className="w-5 h-5" />
        </button>
      }
    >
      <div className="brand-modal-scroll brand-modal-body">
        <p className="brand-eyebrow mb-1 pr-9">Step 2 of 3</p>
        <h3 className="font-heading text-xl sm:text-2xl mb-2 text-[#1c1917] pr-9">What Service?</h3>
        <div className="brand-rule w-16 mb-3" aria-hidden />
        <p className="text-sm text-[#78716c] mb-4 leading-relaxed">
          Select the service you&apos;d like to book — we&apos;ll show only the dates available for it. Booking for more
          than one client? Please submit a separate booking for each person.
        </p>

        <div>
          {serviceLocation === 'home_service' && (
            <div className="brand-note mb-4">
              <p className="brand-eyebrow mb-1.5">Home service fee</p>
              <p className="text-xs sm:text-sm leading-relaxed">
                Within Manila City: ₱1,500 · Within Metro Manila: ₱2,000 · Outside Metro Manila or group bookings:
                starts at ₱3,000 with a minimum of 3 clients. Message us for special arrangements. The fee is on top of
                the service, and a Grab transport fee applies. Manila &amp; Metro Manila cover 1 client (+₱500 per
                additional client).
              </p>
            </div>
          )}

          <div className="space-y-3">
            {services.map((service) => {
              const normalized = normalizeServiceValue(service.value);
              const selected = localSelectedService === service.value;
              return (
                <div key={service.value} className="w-full">
                  <OptionCard
                    className="w-full"
                    selected={selected}
                    onClick={() => {
                      if (!normalized) return;
                      setLocalSelectedService(normalized);
                    }}
                    right={
                      <OptionCardBadge selected={selected}>
                        {service.slots === 1 ? '1 slot' : `${service.slots} slots`}
                      </OptionCardBadge>
                    }
                  >
                    <OptionCardTitle>{service.label}</OptionCardTitle>
                    <OptionCardDescription selected={selected}>{service.description}</OptionCardDescription>
                  </OptionCard>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="brand-modal-footer flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button variant="default" className="flex-1" onClick={handleContinue} disabled={!localSelectedService}>
          Continue
        </Button>
      </div>
    </OverlayModal>
  );
}
