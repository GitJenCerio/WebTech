'use client';

import { ArrowLeft } from 'lucide-react';
import type { NailTech } from '@/lib/types';
import { OverlayModal } from '@/components/ui/OverlayModal';
import { OptionCard, OptionCardTitle, OptionCardDescription } from '@/components/ui/OptionCard';
import { Button } from '@/components/ui/Button';

interface DualNailTechSelectionModalProps {
  isOpen: boolean;
  nailTechs: NailTech[];
  serviceLocation: 'homebased_studio' | 'home_service';
  manicureTechId: string | null;
  pedicureTechId: string | null;
  onSelectManicure: (nailTechId: string) => void;
  onSelectPedicure: (nailTechId: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function DualNailTechSelectionModal({
  isOpen,
  nailTechs,
  serviceLocation,
  manicureTechId,
  pedicureTechId,
  onSelectManicure,
  onSelectPedicure,
  onContinue,
  onBack,
}: DualNailTechSelectionModalProps) {
  // For simultaneous Mani+Pedi, all techs are visible regardless of serviceAvailability or location.
  const availableTechs = nailTechs;

  const canContinue = Boolean(manicureTechId && pedicureTechId && manicureTechId !== pedicureTechId);

  return (
    <OverlayModal
      isOpen={isOpen}
      onClose={onBack}
      size="lg"
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
        <h3 className="font-heading text-xl sm:text-2xl mb-2 text-[#1c1917] pr-9">Choose 2 Nail Technicians</h3>
        <div className="brand-rule w-16 mb-3" aria-hidden />
        <p className="text-sm text-[#78716c] mb-4 leading-relaxed">
          Pick one technician for <span className="text-[#1c1917]">Manicure</span> and a different one for{' '}
          <span className="text-[#1c1917]">Pedicure</span>. We’ll show only times where both are available.
        </p>

        {availableTechs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="brand-eyebrow mb-2">Manicure (Nail Tech)</p>
              <div className="space-y-3">
                {availableTechs.map((tech) => {
                  const selected = manicureTechId === tech.id;
                  const disabled = pedicureTechId === tech.id;
                  return (
                    <OptionCard
                      key={`mani-${tech.id}`}
                      selected={selected}
                      onClick={() => !disabled && onSelectManicure(tech.id)}
                      disabled={disabled}
                    >
                      <OptionCardTitle>Ms. {tech.name}</OptionCardTitle>
                      <OptionCardDescription>{tech.role}</OptionCardDescription>
                    </OptionCard>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="brand-eyebrow mb-2">Pedicure (Nail Tech)</p>
              <div className="space-y-3">
                {availableTechs.map((tech) => {
                  const selected = pedicureTechId === tech.id;
                  const disabled = manicureTechId === tech.id;
                  return (
                    <OptionCard
                      key={`pedi-${tech.id}`}
                      selected={selected}
                      onClick={() => !disabled && onSelectPedicure(tech.id)}
                      disabled={disabled}
                    >
                      <OptionCardTitle>Ms. {tech.name}</OptionCardTitle>
                      <OptionCardDescription>{tech.role}</OptionCardDescription>
                    </OptionCard>
                  );
                })}
              </div>
            </div>
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
        <Button variant="default" className="flex-1" onClick={onContinue} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </OverlayModal>
  );
}

