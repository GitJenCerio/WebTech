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
