/**
 * Helpers for booking-level invoice totals (including Mani + Pedi Express dual invoices).
 */

export type InvoiceSlice = {
  quotationId?: string;
  total?: number;
  nailTechId?: string;
  createdAt?: Date | string;
  discountAmount?: number;
};

function hasSecondaryNailTechId(secondaryNailTechId?: string): boolean {
  return typeof secondaryNailTechId === 'string' && secondaryNailTechId.trim().length > 0;
}

/**
 * Mani + Pedi Express with two techs: must have a secondary nail tech.
 * Recognizes canonical slug `mani_pedi_simultaneous`, `mode: simultaneous_two_techs`,
 * and legacy/display `service.type` values stored in MongoDB (e.g. "Mani + Pedi Express").
 */
export function isDualTechManiPediExpress(booking: {
  service?: { type?: string; mode?: string; secondaryNailTechId?: string };
}): boolean {
  if (!hasSecondaryNailTechId(booking.service?.secondaryNailTechId)) return false;

  if (booking.service?.mode === 'simultaneous_two_techs') return true;

  const t = (booking.service?.type || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (t === 'mani_pedi_simultaneous') return true;
  if (t === 'mani + pedi express') return true;
  const looksExpress =
    (t.includes('express') || t.includes('simultaneous')) &&
    (t.includes('mani') || t.includes('manicure')) &&
    (t.includes('pedi') || t.includes('pedicure'));
  return looksExpress;
}

/** True when `service.type` refers to Mani + Pedi Express (slug or stored display string). */
export function isExpressManiPediServiceType(type?: string): boolean {
  if (!type) return false;
  if (type === 'mani_pedi_simultaneous') return true;
  const t = type.toLowerCase().replace(/\s+/g, ' ').trim();
  if (t === 'mani + pedi express') return true;
  return (
    (t.includes('express') || t.includes('simultaneous')) &&
    (t.includes('mani') || t.includes('manicure')) &&
    (t.includes('pedi') || t.includes('pedicure'))
  );
}

/** Admin UI often only has flat `service` string + ids — pass optional `serviceMode` from `booking.service.mode`. */
export function isManiPediExpressDualFromParts(
  serviceType: string | undefined,
  secondaryNailTechId: string | undefined,
  serviceMode?: string | null
): boolean {
  return isDualTechManiPediExpress({
    service: {
      type: serviceType,
      mode: serviceMode ?? undefined,
      secondaryNailTechId,
    },
  });
}

export function hasRealInvoiceSlice(inv: InvoiceSlice | null | undefined): boolean {
  if (!inv) return false;
  return Boolean(
    inv.quotationId || (typeof inv.total === 'number' && inv.total > 0)
  );
}

/** Combined invoice total for payment / balance (dual express sums both segments when present). */
export function getCombinedInvoiceTotal(booking: {
  service?: { type?: string; mode?: string; secondaryNailTechId?: string };
  invoice?: InvoiceSlice | null;
  secondaryInvoice?: InvoiceSlice | null;
}): number {
  if (!isDualTechManiPediExpress(booking)) {
    const inv = booking.invoice;
    if (!hasRealInvoiceSlice(inv || undefined)) return 0;
    return Number(inv?.total) || 0;
  }
  const a = hasRealInvoiceSlice(booking.invoice || undefined) ? Number(booking.invoice?.total) || 0 : 0;
  const b = hasRealInvoiceSlice(booking.secondaryInvoice || undefined)
    ? Number(booking.secondaryInvoice?.total) || 0
    : 0;
  return a + b;
}

export function hasAnyRealInvoice(booking: {
  service?: { type?: string; mode?: string; secondaryNailTechId?: string };
  invoice?: InvoiceSlice | null;
  secondaryInvoice?: InvoiceSlice | null;
}): boolean {
  if (!isDualTechManiPediExpress(booking)) {
    return hasRealInvoiceSlice(booking.invoice || undefined);
  }
  return (
    hasRealInvoiceSlice(booking.invoice || undefined) ||
    hasRealInvoiceSlice(booking.secondaryInvoice || undefined)
  );
}

export function sumStoredInvoiceDiscounts(booking: {
  invoice?: InvoiceSlice | null;
  secondaryInvoice?: InvoiceSlice | null;
}): number {
  const a = typeof booking.invoice?.discountAmount === 'number' ? booking.invoice.discountAmount : 0;
  const b =
    typeof booking.secondaryInvoice?.discountAmount === 'number'
      ? booking.secondaryInvoice.discountAmount
      : 0;
  return a + b;
}
