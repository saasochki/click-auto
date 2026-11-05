import type { Prisma } from '@clickauto/db';
import { toUsdMinor, type Currency, type UsdRates } from '@clickauto/shared';
import { COMPAT_YEARS_MAX } from './document';

/** Attribute keys that are not equality filters. */
const TEXT_ATTRIBUTES = new Set(['oem']);

export function compatTokens(
  value: Prisma.JsonValue,
  thisYear = new Date().getUTCFullYear(),
): string[] {
  if (!Array.isArray(value)) return [];
  const tokens: string[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const { modelId, yearFrom, yearTo } = item as Record<string, unknown>;
    if (typeof modelId !== 'string') continue;
    tokens.push(modelId);
    // No years means "fits every year": the plain model token is enough.
    if (typeof yearFrom !== 'number' && typeof yearTo !== 'number') {
      tokens.push(`${modelId}:any`);
      continue;
    }
    const from = typeof yearFrom === 'number' ? yearFrom : thisYear - COMPAT_YEARS_MAX;
    const to = typeof yearTo === 'number' ? yearTo : thisYear + 1;
    for (let year = Math.max(from, to - COMPAT_YEARS_MAX); year <= to; year += 1) {
      tokens.push(`${modelId}:${year}`);
    }
  }
  return [...new Set(tokens)];
}

export function attributeTokens(value: Prisma.JsonValue): {
  attrs: string[];
  oem: string | null;
  quantity: number | null;
} {
  const attrs: string[] = [];
  let oem: string | null = null;
  let quantity: number | null = null;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, raw] of Object.entries(value)) {
      if (key === 'oem' && typeof raw === 'string') oem = raw;
      if (key === 'quantity' && typeof raw === 'number') quantity = raw;
      if (TEXT_ATTRIBUTES.has(key)) continue;
      const values = Array.isArray(raw) ? raw : [raw];
      for (const item of values) {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          attrs.push(`${key}=${String(item)}`);
        }
      }
    }
  }
  return { attrs, oem, quantity };
}

/** USD needs no rates; other currencies stay unpriced until rates are known. */
export function usdPrice(
  amount: bigint | null,
  currency: Currency | null,
  rates: UsdRates | null,
): number | null {
  if (amount === null || !currency) return null;
  if (currency === 'USD') return Number(amount);
  return rates ? toUsdMinor(amount, currency, rates) : null;
}
