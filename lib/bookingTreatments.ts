import { formatPeso } from '@/lib/constants/policy';

export type BookingServiceType =
  | 'manicure'
  | 'pedicure'
  | 'mani_pedi'
  | 'mani_pedi_simultaneous'
  | 'home_service_2slots'
  | 'home_service_3slots';

export type NailTreatmentId =
  | 'cleaning'
  | 'without-extensions'
  | 'with-extensions'
  | 'nail-reconstruction';

export type BookingPackageKind = 'single' | 'combo' | 'express';

export interface NailTreatmentOption {
  id: NailTreatmentId;
  label: string;
  price: number;
  exactPrice: boolean;
}

export interface PediTreatmentOption {
  id: string;
  label: string;
  price: number;
  exactPrice: boolean;
}

export interface BookingPackageOption {
  id: string;
  kind: BookingPackageKind;
  serviceType: BookingServiceType;
  treatmentId?: string;
  label: string;
  description: string;
  price: number;
  exactPrice: boolean;
  slots: number;
}

export const NAIL_TREATMENTS: NailTreatmentOption[] = [
  {
    id: 'cleaning',
    label: 'Russian Manicure (Cleaning only)',
    price: 1000,
    exactPrice: true,
  },
  {
    id: 'without-extensions',
    label: 'BIAB/Gel/Hardgel Overlay',
    price: 1300,
    exactPrice: false,
  },
  {
    id: 'with-extensions',
    label: 'BIAB/Gel/Hardgel Overlay (With Extensions)',
    price: 1800,
    exactPrice: false,
  },
  {
    id: 'nail-reconstruction',
    label: 'Nail Reconstruction',
    price: 1800,
    exactPrice: false,
  },
];

export const PEDI_TREATMENTS: PediTreatmentOption[] = [
  {
    id: 'pedi-cleaning',
    label: 'Russian Pedicure (Cleaning only)',
    price: 1200,
    exactPrice: true,
  },
  {
    id: 'russian-pedicure',
    label: 'Russian Pedicure with Gel Overlay',
    price: 1500,
    exactPrice: true,
  },
];

const SINGLE_SLOT_DESCRIPTION = 'One slot at the studio (two slots for home service).';

export const BOOKING_PACKAGES: BookingPackageOption[] = [
  ...NAIL_TREATMENTS.map((treatment) => ({
    id: treatment.id,
    kind: 'single' as const,
    serviceType: 'manicure' as const,
    treatmentId: treatment.id,
    label: treatment.label,
    description: treatment.exactPrice
      ? SINGLE_SLOT_DESCRIPTION
      : 'Starting price — final amount depends on nail condition and design.',
    price: treatment.price,
    exactPrice: treatment.exactPrice,
    slots: 1,
  })),
  ...PEDI_TREATMENTS.map((treatment) => ({
    id: treatment.id,
    kind: 'single' as const,
    serviceType: 'pedicure' as const,
    treatmentId: treatment.id,
    label: treatment.label,
    description: SINGLE_SLOT_DESCRIPTION,
    price: treatment.price,
    exactPrice: treatment.exactPrice,
    slots: 1,
  })),
  {
    id: 'mani_pedi_simultaneous',
    kind: 'express',
    serviceType: 'mani_pedi_simultaneous',
    label: 'Mani + Pedi Express',
    description: 'Manicure and pedicure with 2 nail techs at the same time.',
    price: 3100,
    exactPrice: false,
    slots: 1,
  },
  {
    id: 'mani_pedi',
    kind: 'combo',
    serviceType: 'mani_pedi',
    label: 'Mani + Pedi Combo',
    description: 'Manicure and pedicure in consecutive slots with one nail tech.',
    price: 2800,
    exactPrice: false,
    slots: 2,
  },
];

export function formatStartsAtPrice(price: number, exact: boolean): string {
  return exact ? formatPeso(price) : `starts at ${formatPeso(price)}`;
}

export function pediTreatmentSlug(id: NailTreatmentId): string {
  return `pedi-${id}`;
}

export function getNailTreatment(id: string | null | undefined): NailTreatmentOption | undefined {
  return NAIL_TREATMENTS.find((treatment) => treatment.id === id);
}

export function getPediTreatment(id: string | null | undefined): PediTreatmentOption | undefined {
  return PEDI_TREATMENTS.find((treatment) => treatment.id === id);
}

export function buildChosenTreatments(
  pkg: BookingPackageOption,
  manicureTreatment?: NailTreatmentId | null,
  pedicureTreatment?: string | null
): string[] {
  if (pkg.kind === 'single' && pkg.treatmentId) {
    return [pkg.treatmentId];
  }
  const chosen: string[] = [];
  if (manicureTreatment) chosen.push(manicureTreatment);
  if (pedicureTreatment) chosen.push(pedicureTreatment);
  return chosen;
}

export function buildServiceLabel(
  pkg: BookingPackageOption,
  manicureTreatment?: NailTreatmentId | null,
  pedicureTreatment?: string | null
): string {
  if (pkg.kind === 'single') return pkg.label;
  const mani = getNailTreatment(manicureTreatment)?.label;
  const pedi = getPediTreatment(pedicureTreatment)?.label;
  if (mani && pedi) return `${pkg.label} · ${mani} + ${pedi}`;
  return pkg.label;
}

export const PRIMARY_TREATMENT_SLUGS = new Set([
  ...NAIL_TREATMENTS.map((t) => t.id),
  ...PEDI_TREATMENTS.map((t) => t.id),
  ...NAIL_TREATMENTS.map((t) => pediTreatmentSlug(t.id)),
]);
