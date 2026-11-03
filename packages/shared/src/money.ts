import type { Currency } from './enums';

/** Money is always an integer amount of minor units. Never use floats for money. */
export interface Money {
  amount: number;
  currency: Currency;
}

/** Minor units per major unit for each supported currency. */
export const MINOR_UNITS: Record<Currency, number> = { MDL: 100, PRB: 100, USD: 100, EUR: 100 };

/** Parses user input like "15 900" or "15900,50" into minor units. Returns null for invalid input. */
export function parseMajorToMinor(input: string, currency: Currency): number | null {
  const normalized = input.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole = '0', frac = ''] = normalized.split('.');
  const factor = MINOR_UNITS[currency];
  const fracDigits = String(factor).length - 1;
  const fracPart = (frac + '0'.repeat(fracDigits)).slice(0, fracDigits);
  const result = Number(whole) * factor + Number(fracPart || '0');
  return Number.isSafeInteger(result) ? result : null;
}
