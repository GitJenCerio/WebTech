'use client';

import { ArrowLeft } from 'lucide-react';
import type { NailTech } from '@/lib/types';
import { OverlayModal } from '@/components/ui/OverlayModal';
import { OptionCard, OptionCardTitle, OptionCardDescription, OptionCardExtra } from '@/components/ui/OptionCard';
import { Button } from '@/components/ui/Button';

interface NailTechSelectionModalProps {
  isOpen: boolean;
  nailTechs: NailTech[];
  selectedNailTechId: string | null;
  serviceLocation: 'homebased_studio' | 'home_service';
  onContinue: (nailTechId: string) => void;
  onBack: () => void;
}

export default function NailTechSelectionModal({
  isOpen,
  nailTechs,
  selectedNailTechId,
  serviceLocation,
  onContinue,
  onBack,
}: NailTechSelectionModalProps) {
  const availableTechs = nailTechs.filter((tech) => {
    if (serviceLocation === 'homebased_studio') {
      return tech.serviceAvailability === 'Studio only' || tech.serviceAvailability === 'Studio and Home Service';
    }
    return tech.serviceAvailability === 'Home service only' || tech.serviceAvailability === 'Studio and Home Service';
  });

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
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
      }
    >
      <div className="p-6 sm:p-8">
        <h3 className="text-2xl font-semibold mb-2 text-gray-900">Choose Your Nail Technician</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select a technician for {serviceLocation === 'homebased_studio' ? 'Home Studio' : 'Home Service'}
        </p>

        {availableTechs.length > 0 ? (
          <div className="space-y-3">
            {availableTechs.map((tech) => {
              const hasDiscount = tech.discount !== undefined && tech.discount !== null && tech.discount > 0;
              const selected = selectedNailTechId === tech.id;
              return (
                <OptionCard key={tech.id} selected={selected} onClick={() => onContinue(tech.id)}>
                  <OptionCardTitle>Ms. {tech.name}</OptionCardTitle>
                  <OptionCardDescription>{tech.role}</OptionCardDescription>
                  {hasDiscount && <OptionCardExtra>🎉 {tech.discount}% discount</OptionCardExtra>}
                </OptionCard>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-600">No technicians available for this service location.</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-300 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    </OverlayModal>
  );
}
