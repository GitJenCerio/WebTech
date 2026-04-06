'use client';

import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { OverlayModal } from '@/components/ui/OverlayModal';
import { OptionCard, OptionCardTitle, OptionCardDescription, OptionCardBadge } from '@/components/ui/OptionCard';
import { Button } from '@/components/ui/Button';

type ServiceLocation = 'homebased_studio' | 'home_service';
type BookingServiceType =
  | 'manicure'
  | 'pedicure'
  | 'mani_pedi'
  | 'mani_pedi_simultaneous'
  | 'group_manicure'
  | 'group_pedicure'
  | 'group_mani_pedi'
  | 'home_service_2slots'
  | 'home_service_3slots';

interface ServiceOption {
  value: BookingServiceType;
  label: string;
  description: string;
  slots: number;
}

const servicesByLocation: Record<ServiceLocation, ServiceOption[]> = {
  homebased_studio: [
    { value: 'manicure', label: 'Manicure', description: 'Professional manicure at our studio', slots: 1 },
    { value: 'pedicure', label: 'Pedicure', description: 'Professional pedicure at our studio', slots: 1 },
    { value: 'mani_pedi', label: 'Mani + Pedi Combo', description: 'Manicure and pedicure combo', slots: 2 },
    { value: 'mani_pedi_simultaneous', label: 'Mani + Pedi Express', description: 'Manicure and pedicure with 2 nail techs at the same time', slots: 1 },
    { value: 'group_manicure', label: 'Mani for 2', description: 'Professional manicure for 2 or more clients', slots: 2 },
    { value: 'group_pedicure', label: 'Pedi for 2', description: 'Professional pedicure for 2 or more clients', slots: 2 },
    { value: 'group_mani_pedi', label: 'Mani + Pedi for 2', description: 'Mani + Pedi for 2 or more clients', slots: 4 },
  ],
  home_service: [
    { value: 'manicure', label: 'Manicure', description: 'Professional manicure at your home', slots: 1 },
    { value: 'pedicure', label: 'Pedicure', description: 'Professional pedicure at your home', slots: 1 },
    { value: 'mani_pedi', label: 'Mani + Pedi Combo', description: 'Manicure and pedicure combo', slots: 2 },
    { value: 'mani_pedi_simultaneous', label: 'Mani + Pedi Express', description: 'Manicure and pedicure with 2 nail techs at the same time', slots: 1 },
    { value: 'group_manicure', label: 'Mani for 2', description: 'Professional manicure for groups at your home', slots: 2 },
    { value: 'group_pedicure', label: 'Pedi for 2', description: 'Professional pedicure for groups at your home', slots: 2 },
    { value: 'group_mani_pedi', label: 'Mani + Pedi for 2', description: 'Mani + Pedi for groups at your home', slots: 4 },
  ],
};

interface ServiceTypeSelectionModalProps {
  isOpen: boolean;
  serviceLocation: ServiceLocation;
  selectedService: BookingServiceType | null;
  onContinue: (serviceType: BookingServiceType, personCount?: number) => void;
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
  const [groupPersonCountInput, setGroupPersonCountInput] = useState<string>('2');

  const normalizeServiceValue = (value: BookingServiceType | string): BookingServiceType | null => {
    if (value === 'Russian Manicure') return 'manicure';
    if (value === 'Russian Manicure w/o Extensions') return 'manicure';
    if (value === 'Russian Manicure w/ Extensions') return 'manicure';
    return (value as BookingServiceType) || null;
  };

  const isGroupService = (value: BookingServiceType | null) =>
    value === 'group_manicure' || value === 'group_pedicure' || value === 'group_mani_pedi';

  const handleContinue = () => {
    if (!localSelectedService) return;
    if (isGroupService(localSelectedService)) {
      const parsed = Number(groupPersonCountInput);
      const personCount = Number.isFinite(parsed) ? Math.max(2, Math.floor(parsed)) : 2;
      onContinue(localSelectedService, personCount);
      return;
    }
    onContinue(localSelectedService);
  };

  // Keep local selection in sync when modal opens or parent value changes.
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedService(selectedService);
      setGroupPersonCountInput('2');
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
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Back"
          type="button"
        >
          <IoClose className="w-6 h-6 text-gray-700" />
        </button>
      }
    >
      <div className="p-6 sm:p-8 max-h-[85vh] flex flex-col">
        <h3 className="text-2xl font-semibold mb-2 text-gray-900 flex-shrink-0">What Service?</h3>
        <p className="text-sm text-gray-600 mb-4 flex-shrink-0">
          Select the service you'd like to book. We'll show only available dates for your selection.
        </p>

        <div className="flex-1 overflow-y-auto -mr-6 pr-0">
          {serviceLocation === 'home_service' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-6 text-sm text-amber-900">
              <p className="font-medium">Home Service charges</p>
              <p className="text-amber-800 mt-0.5">Base rate starts at ₱1,500 (depends on location) + ₱500 for each additional head</p>
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

          {localSelectedService && isGroupService(localSelectedService) && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-900">How many person(s)?</p>
              <input
                type="number"
                min={2}
                value={groupPersonCountInput}
                onChange={(e) => setGroupPersonCountInput(e.target.value)}
                onBlur={() => {
                  const parsed = Number(groupPersonCountInput);
                  if (!Number.isFinite(parsed) || parsed < 2) {
                    setGroupPersonCountInput('2');
                    return;
                  }
                  setGroupPersonCountInput(String(Math.floor(parsed)));
                }}
                className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <p className="mt-1 text-xs text-gray-600">
                Slot requirement will be based on selected persons. If not complete, please contact our FB page for special requests.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-300 flex gap-3 flex-shrink-0 bg-white">
          <Button variant="secondary" className="flex-1" onClick={onBack}>
            Back
          </Button>
          <Button variant="default" className="flex-1" onClick={handleContinue} disabled={!localSelectedService}>
            Continue
          </Button>
        </div>
      </div>
    </OverlayModal>
  );
}
