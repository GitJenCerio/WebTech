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
          className="brand-icon-btn"
          aria-label="Back"
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      }
    >
      <div className="brand-modal-scroll brand-modal-body">
        <p className="brand-eyebrow mb-1 pr-9">Step 3 of 3</p>
        <h3 className="font-heading text-xl sm:text-2xl mb-2 text-[#1c1917] pr-9">Choose Your Nail Technician</h3>
        <div className="brand-rule w-16 mb-3" aria-hidden />
        <p className="text-sm text-[#78716c] mb-4">
          Select a technician for {serviceLocation === 'homebased_studio' ? 'Home Studio' : 'Home Service'}.
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
                  {hasDiscount && (
                    <OptionCardExtra>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] border ${
                          selected
                            ? 'border-[#c4b5a0]/50 text-[#fffcfa]'
                            : 'border-[#c4b5a0] text-[#3d342c]'
                        }`}
                      >
                        {tech.discount}% off
                      </span>
                    </OptionCardExtra>
                  )}
                </OptionCard>
              );
            })}
          </div>
        ) : (
          <div className="brand-panel-soft p-4 text-center">
            <p className="text-sm text-[#78716c]">No technicians available for this service location.</p>
          </div>
        )}
      </div>

      <div className="brand-modal-footer flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          Back
        </Button>
      </div>
    </OverlayModal>
  );
}
