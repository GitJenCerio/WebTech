'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { NailTech } from '@/lib/types';

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
  if (!isOpen) return null;

  // Filter nail techs based on service location
  const availableTechs = nailTechs.filter((tech) => {
    if (serviceLocation === 'homebased_studio') {
      return tech.serviceAvailability === 'Studio only' || tech.serviceAvailability === 'Studio and Home Service';
    } else {
      return tech.serviceAvailability === 'Home service only' || tech.serviceAvailability === 'Studio and Home Service';
    }
  });

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
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        <h3 className="text-2xl font-semibold mb-2 pr-10 text-gray-900">Choose Your Nail Technician</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select a technician for {serviceLocation === 'homebased_studio' ? 'Home Studio' : 'Home Service'}
        </p>

        {availableTechs.length > 0 ? (
          <div className="space-y-3">
            {availableTechs.map((tech) => {
              const hasDiscount = tech.discount !== undefined && tech.discount !== null && tech.discount > 0;
              return (
                <button
                  key={tech.id}
                  onClick={() => onContinue(tech.id)}
                  className={`w-full text-left rounded-lg border-2 p-4 transition-all active:scale-[0.98] touch-manipulation ${
                    selectedNailTechId === tech.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-base">Ms. {tech.name}</p>
                      <p className={`text-xs sm:text-sm opacity-75 mt-1 ${
                        selectedNailTechId === tech.id ? 'text-white/75' : 'text-gray-600'
                      }`}>
                        {tech.role}
                      </p>
                      {hasDiscount && (
                        <p className={`text-xs sm:text-sm font-semibold mt-2 ${
                          selectedNailTechId === tech.id ? 'text-green-300' : 'text-green-700'
                        }`}>
                          🎉 {tech.discount}% discount
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-600">No technicians available for this service location.</p>
          </div>
        )}

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
