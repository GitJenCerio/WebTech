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
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Back"
          type="button"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
      }
    >
      <div className="p-6 sm:p-8">
        <h3 className="text-2xl font-semibold mb-2 text-gray-900">Choose 2 Nail Technicians</h3>
        <p className="text-sm text-gray-600 mb-6">
          Pick one technician for <strong>Manicure</strong> and a different one for <strong>Pedicure</strong>. We’ll show only times where both are available.
        </p>

        {availableTechs.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Manicure tech</p>
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
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Pedicure tech</p>
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
          <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-600">No technicians available for this service location.</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-300 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onBack}>
            Back
          </Button>
          <Button variant="default" className="flex-1" onClick={onContinue} disabled={!canContinue}>
            Continue
          </Button>
        </div>
      </div>
    </OverlayModal>
  );
}

