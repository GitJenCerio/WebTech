'use client';

import { motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import type { ServiceType } from '@/lib/types';

type ServiceLocation = 'homebased_studio' | 'home_service';

interface ServiceOption {
  value: ServiceType;
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
  if (!isOpen) return null;

  const services = servicesByLocation[serviceLocation];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-2 border-gray-300 rounded-xl max-w-md w-full p-6 sm:p-8 shadow-2xl my-4 max-h-[90vh] overflow-y-auto relative"
      >
        <button
          onClick={onBack}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Back"
          type="button"
        >
          <IoClose className="w-6 h-6 text-gray-700" />
        </button>

        <h3 className="text-2xl font-semibold mb-2 pr-10 text-gray-900">What Service?</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select the service you'd like to book. We'll show only available dates for your selection.
        </p>

        <div className="space-y-3">
          {services.map((service) => (
            <button
              key={service.value}
              onClick={() => onContinue(service.value)}
              className={`w-full text-left rounded-lg border-2 p-4 transition-all active:scale-[0.98] touch-manipulation ${
                selectedService === service.value
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-base">{service.label}</p>
                  <p className={`text-xs sm:text-sm opacity-75 mt-1 ${
                    selectedService === service.value ? 'text-white/75' : 'text-gray-600'
                  }`}>
                    {service.description}
                  </p>
                </div>
                <div className={`whitespace-nowrap text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full border ${
                  selectedService === service.value
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}>
                  {service.slots === 1 ? '1 slot' : `${service.slots} slots`}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-300 flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors active:scale-[0.98] touch-manipulation text-sm"
          >
            Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
