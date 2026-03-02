/**
 * Get required slot count for a service type.
 * Handles display names (Manicure, Manicure + Pedicure) and legacy client codes (manicure, mani_pedi).
 */
export function getRequiredSlotCountForService(
  serviceType: string,
  serviceLocation?: 'homebased_studio' | 'home_service'
): number {
  if (!serviceType || !serviceType.trim()) return 1;

  const key = serviceType.toLowerCase().trim().replace(/\s+/g, ' ');

  // Manicure / Pedicure
  if (key === 'manicure' || key === 'pedicure') {
    return serviceLocation === 'home_service' ? 2 : 1;
  }
  // Manicure + Pedicure variants
  if (key.includes('mani') && key.includes('pedi')) {
    if (key.includes('for 2') || key.includes('2 pax')) return 4;
    if (key.includes('for 1') || key.includes('1 pax')) return 2;
    return 2;
  }
  if (key.includes('home_service_2slots') || key === 'mani + pedi 2 pax') return 4;
  if (key.includes('home_service_3slots') || key === 'mani + pedi 3 pax') return 3;

  // Standard names: Manicure for 2, Pedicure for 2, Manicure + Pedicure for 2
  if (key.includes('manicure for 2') || key.includes('pedicure for 2')) return 2;
  if (key.includes('manicure + pedicure for 2')) return 4;
  if (key.includes('manicure + pedicure for 1') || key.includes('manicure + pedicure')) return 2;

  return 1;
}
