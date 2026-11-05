import { MINOR_UNITS, type Currency } from '@clickauto/shared';

/** Currency signs as in the design: "15 900 $", "1 200 руб.", "3 200 лей". */
const SIGNS_RU: Record<Currency, string> = { USD: '$', EUR: '€', PRB: 'руб.', MDL: 'лей' };
const SIGNS_RO: Record<Currency, string> = { USD: '$', EUR: '€', PRB: 'rub.', MDL: 'lei' };
const signs = (locale: string) => (locale === 'ro' ? SIGNS_RO : SIGNS_RU);

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

/** Price in the author's currency. Amount is in minor units. */
export function formatPrice(amount: number, currency: Currency, locale: string): string {
  const major = amount / MINOR_UNITS[currency];
  return `${formatNumber(major, locale)} ${signs(locale)[currency]}`;
}

/** Minor units back to the text of the price field: 1590000 USD -> "15900". */
export function minorToInput(amount: number, currency: Currency): string {
  const major = amount / MINOR_UNITS[currency];
  return Number.isInteger(major) ? String(major) : major.toFixed(2);
}

/** "3 нояб." or "3 нояб. 2025" when the year differs from the current one. */
export function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  }).format(date);
}

export function formatYear(iso: string): number {
  return new Date(iso).getFullYear();
}
