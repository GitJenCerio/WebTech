/** Map form service slugs to display labels (e.g. BIAB, Extensions) */
export const CHOSEN_SERVICE_LABELS: Record<string, string> = {
  removal: 'Removal',
  cleaning: 'Cleaning Only',
  'without-extensions': 'BIAB / Gel Overlay',
  'with-extensions': 'Extensions',
  'russian-pedicure': 'Russian Pedicure Gel Overlay',
  'minimal-design': '+ Minimal Design',
  'intricate-design': '+ Intricate Design',
};

/** Map slot service type to display label */
export const SLOT_SERVICE_LABELS: Record<string, string> = {
  manicure: 'Manicure',
  pedicure: 'Pedicure',
  mani_pedi: 'Mani + Pedi',
  home_service_2slots: 'Mani + Pedi (4 slots)',
  home_service_3slots: 'Mani + Pedi (3 slots)',
  russian_manicure: 'Russian Manicure',
  russian_pedicure: 'Russian Pedicure',
  'russian_mani_+_pedi': 'Russian Mani + Pedi',
  russian_manicure_for_2: 'Russian Manicure for 2',
  russian_pedicure_for_2: 'Russian Pedicure for 2',
  'russian_mani_+_pedi_for_1': 'Russian Mani + Pedi for 1',
  'russian_mani_+_pedi_for_2': 'Russian Mani + Pedi for 2',
};

export function getChosenServicesDisplay(chosenServices: string[] | undefined): string {
  if (!chosenServices?.length) return '';
  const labels = chosenServices
    .map((s) => CHOSEN_SERVICE_LABELS[s] || s.replace(/-/g, ' '))
    .filter(Boolean);
  return labels.join(', ');
}

export function getSlotServiceDisplay(type: string | undefined): string {
  if (!type) return 'Nail Service';
  const key = type.toLowerCase().replace(/\s+/g, '_');
  return SLOT_SERVICE_LABELS[key] || type;
}
