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

/** Exchange rates scale: rates are kept as integers of millionths (18.0644 → 18_064_400n). */
export const RATE_SCALE = 1_000_000n;

/**
 * Latest official rates, in millionths of the quote currency per one base unit.
 * usdMdl and eurMdl come from NBM, usdPrb from PRB. PRB ↔ MDL goes through USD.
 */
export interface UsdRates {
  usdMdl: bigint;
  eurMdl: bigint;
  usdPrb: bigint;
}

/** Parses a decimal rate string like "18.0644" into millionths. Returns null for invalid input. */
export function parseRate(input: string): bigint | null {
  const match = /^(\d+)(?:\.(\d{1,6})\d*)?$/.exec(input.trim().replace(',', '.'));
  if (!match) return null;
  const [, whole = '0', frac = ''] = match;
  const value = BigInt(whole) * RATE_SCALE + BigInt((frac + '000000').slice(0, 6));
  return value > 0n ? value : null;
}

function divRound(a: bigint, b: bigint): bigint {
  return (a * 2n + b) / (b * 2n);
}

/**
 * Converts an amount in minor units to USD minor units, rounded to the nearest cent.
 * Used only for the price filter and sorting; buyers always see the author's currency.
 */
export function toUsdMinor(amount: number | bigint, currency: Currency, rates: UsdRates): number {
  const value = BigInt(amount);
  let usd: bigint;
  switch (currency) {
    case 'USD':
      usd = value;
      break;
    case 'MDL':
      usd = divRound(value * RATE_SCALE, rates.usdMdl);
      break;
    case 'PRB':
      usd = divRound(value * RATE_SCALE, rates.usdPrb);
      break;
    case 'EUR':
      usd = divRound(value * rates.eurMdl, rates.usdMdl);
      break;
  }
  return Number(usd);
}
