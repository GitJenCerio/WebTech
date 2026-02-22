/**
 * Cleans a currency value (string or number) and returns a number.
 * Removes currency symbols (₱, $, etc.), commas, and non-numeric chars.
 */
export function cleanCurrencyValue(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.\-]/g, '').trim();
  return parseFloat(cleaned) || 0;
}
