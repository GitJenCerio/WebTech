import { isExpressManiPediServiceType } from '@/lib/utils/bookingInvoice';

/**
 * Normalizes a service name for comparison (lowercase, & → and, alphanumeric only).
 */
export function normalizeServiceName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * Finds a pricing row by service name (exact or partial match).
 */
export function findPricingRow<T extends Record<string, unknown>>(
  pricingData: T[],
  serviceName: string,
  normalize: (v: string) => string
): T | null {
  if (!serviceName || pricingData.length === 0) return null;
  const normalized = normalize(serviceName.trim());
  if (!normalized) return null;

  return (
    pricingData.find((item) => {
      const firstKey = Object.keys(item)[0];
      const name = String(item[firstKey] || '').trim();
      const rowNorm = normalize(name);
      return rowNorm === normalized;
    }) ??
    pricingData.find((item) => {
      const firstKey = Object.keys(item)[0];
      const name = String(item[firstKey] || '').trim();
      const rowNorm = normalize(name);
      return rowNorm.includes(normalized) || normalized.includes(rowNorm);
    }) ??
    null
  );
}

/**
 * Gets unit price for a service from pricing data.
 */
export function getUnitPriceForService(
  pricingData: Record<string, unknown>[],
  pricingHeaders: string[],
  serviceName: string,
  cleanCurrency: (v: string | number) => number
): number | null {
  const found = findPricingRow(pricingData, serviceName, normalizeServiceName);
  if (!found) return null;

  const priceKey =
    pricingHeaders.find((h) => {
      const key = h.toLowerCase();
      return key.includes('price') || key.includes('amount') || key.includes('cost') || key.includes('rate');
    }) || pricingHeaders[1];

  if (priceKey && Object.prototype.hasOwnProperty.call(found, priceKey)) {
    const raw = found[priceKey];
    const value = cleanCurrency(
      typeof raw === 'string' || typeof raw === 'number' ? raw : 0
    );
    if (value > 0) return value;
  }

  for (const key of Object.keys(found)) {
    const raw = found[key];
    const val = cleanCurrency(
      typeof raw === 'string' || typeof raw === 'number' ? raw : 0
    );
    if (val > 0) return val;
  }

  return null;
}

export type InvoiceLineDraft = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

const MANI_PEDI_EXPRESS_NORM = normalizeServiceName('Mani + Pedi Express');

/** True when the line is the combo "Mani + Pedi Express" row (not plain Manicure/Pedicure). */
export function isManiPediExpressComboLineDescription(description: string): boolean {
  const n = normalizeServiceName(description);
  if (!n) return false;
  if (n === MANI_PEDI_EXPRESS_NORM) return true;
  if (n.includes('manipedexpress')) return true;
  return n.includes('mani') && n.includes('pedi') && n.includes('express');
}

/**
 * Two invoice lines (Manicure + Pedicure) for Mani + Pedi Express, using standalone manicure/pedicure prices.
 */
export function buildManiPediExpressInvoiceItems(
  pricingData: Record<string, unknown>[],
  pricingHeaders: string[],
  cleanCurrency: (v: string | number) => number
): InvoiceLineDraft[] {
  const mani = getUnitPriceForService(pricingData, pricingHeaders, 'Manicure', cleanCurrency);
  const pedi = getUnitPriceForService(pricingData, pricingHeaders, 'Pedicure', cleanCurrency);
  const items: InvoiceLineDraft[] = [];
  if (mani != null && mani > 0) {
    items.push({ description: 'Manicure', quantity: 1, unitPrice: mani, total: mani });
  }
  if (pedi != null && pedi > 0) {
    items.push({ description: 'Pedicure', quantity: 1, unitPrice: pedi, total: pedi });
  }
  return items;
}

/**
 * Replaces mistaken duplicate "Mani + Pedi Express" combo lines with separate Manicure + Pedicure lines.
 */
export function maybeNormalizeManiPediExpressInvoiceItems(
  serviceType: string | undefined,
  items: InvoiceLineDraft[],
  pricingData: Record<string, unknown>[],
  pricingHeaders: string[],
  cleanCurrency: (v: string | number) => number
): InvoiceLineDraft[] {
  if (!isExpressManiPediServiceType(serviceType) || pricingData.length === 0 || items.length === 0) {
    return items;
  }
  const allCombo =
    items.length > 0 &&
    items.every((i) => isManiPediExpressComboLineDescription(i.description));
  if (!allCombo) return items;
  const split = buildManiPediExpressInvoiceItems(pricingData, pricingHeaders, cleanCurrency);
  return split.length > 0 ? split : items;
}

/** Which standalone service each tech performs in Express (secondary is explicit on booking). */
export function getExpressSegmentLabels(secondaryServiceType?: string): {
  primary: 'Manicure' | 'Pedicure';
  secondary: 'Manicure' | 'Pedicure';
} {
  if (secondaryServiceType === 'Pedicure') {
    return { primary: 'Manicure', secondary: 'Pedicure' };
  }
  if (secondaryServiceType === 'Manicure') {
    return { primary: 'Pedicure', secondary: 'Manicure' };
  }
  return { primary: 'Manicure', secondary: 'Pedicure' };
}

/** Invoice line title: distinguishes express segments while prices still use Manicure/Pedicure rows from the sheet. */
export function expressBrandedLineDescription(service: 'Manicure' | 'Pedicure'): string {
  return `Mani + Pedi Express (${service})`;
}

/** One line item for the primary or secondary tech in Mani + Pedi Express. */
export function buildExpressSegmentInvoiceItems(
  pricingData: Record<string, unknown>[],
  pricingHeaders: string[],
  cleanCurrency: (v: string | number) => number,
  segment: 'primary' | 'secondary',
  secondaryServiceType?: string
): InvoiceLineDraft[] {
  const { primary, secondary } = getExpressSegmentLabels(secondaryServiceType);
  const base = segment === 'primary' ? primary : secondary;
  const price = getUnitPriceForService(pricingData, pricingHeaders, base, cleanCurrency);
  if (price == null || price <= 0) return [];
  const description = expressBrandedLineDescription(base);
  return [{ description, quantity: 1, unitPrice: price, total: price }];
}

/** When a saved quotation had both Mani + Pedi lines, keep only the lines for this tech's segment. */
export function filterInvoiceItemsToExpressSegment(
  items: InvoiceLineDraft[],
  segment: 'primary' | 'secondary',
  secondaryServiceType?: string
): InvoiceLineDraft[] {
  if (items.length === 0) return items;
  const { primary, secondary } = getExpressSegmentLabels(secondaryServiceType);
  const want = segment === 'primary' ? primary : secondary;
  const wn = normalizeServiceName(want);
  const wBranded = normalizeServiceName(expressBrandedLineDescription(want));
  const matching = items.filter((i) => {
    const n = normalizeServiceName(i.description);
    return n === wn || n === wBranded;
  });
  return matching.length > 0 ? matching : items;
}
