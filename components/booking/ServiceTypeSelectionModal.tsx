'use client';

import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { OverlayModal } from '@/components/ui/OverlayModal';
import { OptionCard, OptionCardTitle, OptionCardDescription, OptionCardBadge } from '@/components/ui/OptionCard';
import { Button } from '@/components/ui/Button';
import {
  BOOKING_PACKAGES,
  NAIL_TREATMENTS,
  PEDI_TREATMENTS,
  buildChosenTreatments,
  buildServiceLabel,
  formatStartsAtPrice,
  type BookingPackageOption,
  type BookingServiceType,
  type NailTreatmentId,
} from '@/lib/bookingTreatments';

type ServiceLocation = 'homebased_studio' | 'home_service';

export interface ServiceSelectionResult {
  serviceType: BookingServiceType;
  chosenTreatments: string[];
  serviceLabel: string;
}

interface ServiceTypeSelectionModalProps {
  isOpen: boolean;
  serviceLocation?: ServiceLocation | null;
  selectedService: BookingServiceType | null;
  onContinue: (selection: ServiceSelectionResult) => void;
  onBack: () => void;
}

export default function ServiceTypeSelectionModal({
  isOpen,
  selectedService,
  onContinue,
  onBack,
}: ServiceTypeSelectionModalProps) {
  const [packageId, setPackageId] = useState<string | null>(null);
  const [maniTreatment, setManiTreatment] = useState<NailTreatmentId | null>(null);
  const [pediTreatment, setPediTreatment] = useState<string | null>(null);
  const [step, setStep] = useState<'package' | 'details'>('package');

  const selectedPackage: BookingPackageOption | undefined = BOOKING_PACKAGES.find((pkg) => pkg.id === packageId);
  const needsDetails = selectedPackage?.kind === 'combo' || selectedPackage?.kind === 'express';

  useEffect(() => {
    if (!isOpen) return;
    setStep('package');
    const match = BOOKING_PACKAGES.find((pkg) => pkg.serviceType === selectedService);
    setPackageId(match?.kind === 'single' ? null : match?.id ?? null);
    setManiTreatment(null);
    setPediTreatment(null);
  }, [isOpen, selectedService]);

  const handleBack = () => {
    if (step === 'details') {
      setStep('package');
      return;
    }
    onBack();
  };

  const handleContinue = () => {
    if (!selectedPackage) return;
    if (needsDetails && step === 'package') {
      setStep('details');
      return;
    }
    if (needsDetails && (!maniTreatment || !pediTreatment)) return;
    onContinue({
      serviceType: selectedPackage.serviceType,
      chosenTreatments: buildChosenTreatments(selectedPackage, maniTreatment, pediTreatment),
      serviceLabel: buildServiceLabel(selectedPackage, maniTreatment, pediTreatment),
    });
  };

  const canContinue =
    !!selectedPackage && (step === 'package' || (!!maniTreatment && !!pediTreatment));

  return (
    <OverlayModal
      isOpen={isOpen}
      onClose={handleBack}
      size="lg"
      zIndex={50}
      closeButton={
        <button
          onClick={handleBack}
          className="brand-icon-btn"
          aria-label="Back"
          type="button"
        >
          <IoClose className="w-5 h-5" />
        </button>
      }
    >
      <div className="brand-modal-scroll brand-modal-body">
        <p className="brand-eyebrow mb-1 pr-9">Step 1 of 3</p>
        <h3 className="font-heading text-xl sm:text-2xl mb-2 text-[#1c1917] pr-9">
          {step === 'package' ? 'What Service?' : selectedPackage?.label}
        </h3>
        <div className="brand-rule w-16 mb-3" aria-hidden />
        <p className="text-sm text-[#78716c] mb-4 leading-relaxed">
          {step === 'package'
            ? 'Select the service you’d like to book — we’ll show only the dates available for it. Booking for more than one client? Please submit a separate booking for each person.'
            : 'Choose the manicure service and the pedicure service for this booking.'}
        </p>

        {step === 'package' ? (
          <div className="space-y-3">
            {BOOKING_PACKAGES.map((pkg) => {
              const selected = packageId === pkg.id;
              const showDescription = pkg.kind === 'combo' || pkg.kind === 'express';
              const subtitle = [
                showDescription ? pkg.description : null,
                pkg.kind === 'combo' ? `${pkg.slots} slots` : null,
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <OptionCard
                  key={pkg.id}
                  className="w-full"
                  selected={selected}
                  onClick={() => setPackageId(pkg.id)}
                  right={
                    <OptionCardBadge selected={selected}>
                      {formatStartsAtPrice(pkg.price, pkg.exactPrice)}
                    </OptionCardBadge>
                  }
                >
                  <OptionCardTitle>{pkg.label}</OptionCardTitle>
                  {subtitle ? (
                    <OptionCardDescription selected={selected}>{subtitle}</OptionCardDescription>
                  ) : null}
                </OptionCard>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="brand-eyebrow mb-2">Manicure</p>
              <div className="space-y-2">
                {NAIL_TREATMENTS.map((treatment) => {
                  const selected = maniTreatment === treatment.id;
                  return (
                    <OptionCard
                      key={`mani-${treatment.id}`}
                      className="w-full"
                      selected={selected}
                      onClick={() => setManiTreatment(treatment.id)}
                    >
                      <OptionCardTitle className="text-base sm:text-lg">{treatment.label}</OptionCardTitle>
                    </OptionCard>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="brand-eyebrow mb-2">Pedicure</p>
              <div className="space-y-2">
                {PEDI_TREATMENTS.map((treatment) => {
                  const selected = pediTreatment === treatment.id;
                  return (
                    <OptionCard
                      key={`pedi-${treatment.id}`}
                      className="w-full"
                      selected={selected}
                      onClick={() => setPediTreatment(treatment.id)}
                      right={
                        <OptionCardBadge selected={selected}>
                          {formatStartsAtPrice(treatment.price, treatment.exactPrice)}
                        </OptionCardBadge>
                      }
                    >
                      <OptionCardTitle className="text-base sm:text-lg">{treatment.label}</OptionCardTitle>
                    </OptionCard>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="brand-modal-footer flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={handleBack}>
          Back
        </Button>
        <Button variant="default" className="flex-1" onClick={handleContinue} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </OverlayModal>
  );
}
