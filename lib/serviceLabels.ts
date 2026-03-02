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

/** Standard display names (no backend codes like mani_pedi on frontend) */
export const STANDARD_SERVICE_NAMES = [
  'Manicure', 'Pedicure', 'Manicure + Pedicure',
  'Manicure for 2', 'Pedicure for 2',
  'Manicure + Pedicure for 1', 'Manicure + Pedicure for 2',
] as const;

/** Map legacy/backend service codes to standard display labels */
export const SLOT_SERVICE_LABELS: Record<string, string> = {
  manicure: 'Manicure',
  pedicure: 'Pedicure',
  mani_pedi: 'Manicure + Pedicure',
  home_service_2slots: 'Manicure + Pedicure for 2',
  home_service_3slots: 'Manicure + Pedicure for 1',
  russian_manicure: 'Manicure',
  russian_pedicure: 'Pedicure',
  'russian_mani_+_pedi': 'Manicure + Pedicure',
  russian_manicure_for_2: 'Manicure for 2',
  russian_pedicure_for_2: 'Pedicure for 2',
  'russian_mani_+_pedi_for_1': 'Manicure + Pedicure for 1',
  'russian_mani_+_pedi_for_2': 'Manicure + Pedicure for 2',
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

/** Map any stored service value (legacy or display) to the standard display name for form/select. */
export function mapServiceToStandardDisplay(service?: string): string {
  if (!service?.trim()) return 'Manicure';
  const k = service.toLowerCase().trim().replace(/\s+/g, ' ');
  if (k.includes('mani') && k.includes('pedi')) {
    if (k.includes('for 2') || k.includes('2 pax') || k.includes('2slots')) return 'Manicure + Pedicure for 2';
    if (k.includes('for 1') || k.includes('1 pax') || k.includes('3slots')) return 'Manicure + Pedicure for 1';
    return 'Manicure + Pedicure';
  }
  if (k.includes('pedicure')) return k.includes('for 2') ? 'Pedicure for 2' : 'Pedicure';
  if (k.includes('manicure')) return k.includes('for 2') ? 'Manicure for 2' : 'Manicure';
  return getSlotServiceDisplay(service) || service.trim();
}
