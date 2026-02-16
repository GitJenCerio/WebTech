'use client';

import { IoClose } from 'react-icons/io5';
import type { ServiceType } from '@/lib/types';
import { OverlayModal } from '@/components/ui/OverlayModal';
import { OptionCard, OptionCardTitle, OptionCardDescription, OptionCardBadge } from '@/components/ui/OptionCard';
import { Button } from '@/components/ui/Button';

type ServiceLocation = 'homebased_studio' | 'home_service';

interface ServiceOption {
  value: ServiceType | string;
  label: string;
  description: string;
  slots: number;
}

const servicesByLocation: Record<ServiceLocation, ServiceOption[]> = {
  homebased_studio: [
    { value: 'manicure', label: 'Manicure', description: 'Professional manicure at our studio', slots: 1 },
    { value: 'pedicure', label: 'Pedicure', description: 'Professional pedicure at our studio', slots: 1 },
    { value: 'mani_pedi', label: 'Mani + Pedi', description: 'Manicure and pedicure combo', slots: 2 },
  ],
  home_service: [
    { value: 'manicure', label: 'Manicure for 2', description: 'Professional manicure for 2 people at your home', slots: 2 },
    { value: 'pedicure', label: 'Pedicure for 2', description: 'Professional pedicure for 2 people at your home', slots: 2 },
    { value: 'mani_pedi', label: 'Mani + Pedi', description: 'Manicure and pedicure combo', slots: 2 },
    { value: 'home_service_2slots', label: 'Mani + Pedi for 2', description: 'Mani + Pedi for 2 people', slots: 2 },
  ],
};

interface ServiceTypeSelectionModalProps {
  isOpen: boolean;
  serviceLocation: ServiceLocation;
  selectedService: ServiceType | null;
  onContinue: (serviceType: ServiceType) => void;
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

  const normalizeServiceValue = (value: ServiceType | string): ServiceType | null => {
    if (value === 'Russian Manicure') return 'manicure';
    if (value === 'Russian Manicure w/o Extensions') return 'manicure';
    if (value === 'Russian Manicure w/ Extensions') return 'manicure';
    return (value as ServiceType) || null;
  };

  return (
    <OverlayModal
      isOpen={isOpen}
      onClose={onBack}
      size="md"
      zIndex={50}
      closeButton={
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Back"
          type="button"
        >
          <IoClose className="w-6 h-6 text-gray-700" />
        </button>
      }
    >
      <div className="p-6 sm:p-8">
        <h3 className="text-2xl font-semibold mb-2 text-gray-900">What Service?</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select the service you'd like to book. We'll show only available dates for your selection.
        </p>

        <div className="space-y-3">
          {services.map((service) => {
            const normalized = normalizeServiceValue(service.value);
            const selected = selectedService === service.value;
            return (
              <OptionCard
                key={service.value}
                selected={selected}
                onClick={() => normalized && onContinue(normalized)}
                right={
                  <OptionCardBadge selected={selected}>
                    {service.slots === 1 ? '1 slot' : `${service.slots} slots`}
                  </OptionCardBadge>
                }
              >
                <OptionCardTitle>{service.label}</OptionCardTitle>
                <OptionCardDescription selected={selected}>{service.description}</OptionCardDescription>
              </OptionCard>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-300 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    </OverlayModal>
  );
}
