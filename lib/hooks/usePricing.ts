'use client';

import { useCallback, useMemo } from 'react';
import { cleanCurrencyValue } from '@/lib/utils/currency';
import { normalizeServiceName, findPricingRow, getUnitPriceForService } from '@/lib/utils/pricing';

export function usePricing(pricingData: Record<string, unknown>[], pricingHeaders: string[]) {
  const findRow = useCallback(
    (serviceName: string) => findPricingRow(pricingData, serviceName, normalizeServiceName),
    [pricingData]
  );

  const getUnitPriceForServiceFn = useCallback(
    (serviceName: string): number | null =>
      getUnitPriceForService(pricingData, pricingHeaders, serviceName, cleanCurrencyValue),
    [pricingData, pricingHeaders]
  );

  return useMemo(
    () => ({
      normalizeServiceName,
      findPricingRow: findRow,
      getUnitPriceForService: getUnitPriceForServiceFn,
    }),
    [findRow, getUnitPriceForServiceFn]
  );
}
