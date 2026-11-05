/**
 * Official exchange rate sources. NBM publishes XML; PRB has no API, so the rate table on
 * the bank's home page is parsed. If a source is down the last received rate stays in use,
 * and an admin can enter the rate by hand.
 */

export interface FetchedRate {
  /** Date the rate is set for, YYYY-MM-DD. */
  date: string;
  base: 'USD' | 'EUR';
  quote: 'MDL' | 'PRB';
  /** Decimal string, e.g. "18.0644". */
  rate: string;
  source: 'nbm' | 'prb';
}

const RATE = /^\d{1,6}(\.\d{1,6})?$/;

function ddmmyyyyToIso(value: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

export function nbmUrl(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `https://www.bnm.md/en/official_exchange_rates?get_xml=1&date=${dd}.${mm}.${date.getUTCFullYear()}`;
}

/** NBM XML: <ValCurs Date="04.11.2026"><Valute><CharCode>USD</CharCode><Nominal>1</Nominal><Value>18.0644</Value>… */
export function parseNbm(xml: string): FetchedRate[] {
  const date = ddmmyyyyToIso(/<ValCurs[^>]*Date="([^"]+)"/.exec(xml)?.[1] ?? '');
  if (!date) throw new Error('nbm: no date');
  const rates: FetchedRate[] = [];
  for (const block of xml.split('<Valute').slice(1)) {
    const code = /<CharCode>([A-Z]{3})<\/CharCode>/.exec(block)?.[1];
    const nominal = /<Nominal>(\d+)<\/Nominal>/.exec(block)?.[1];
    const value = /<Value>([\d.]+)<\/Value>/.exec(block)?.[1];
    if ((code === 'USD' || code === 'EUR') && nominal === '1' && value && RATE.test(value)) {
      rates.push({ date, base: code, quote: 'MDL', rate: value, source: 'nbm' });
    }
  }
  if (!rates.some((r) => r.base === 'USD') || !rates.some((r) => r.base === 'EUR')) {
    throw new Error('nbm: USD or EUR missing');
  }
  return rates;
}

export const PRB_URL = 'https://www.cbpmr.net/';

/** PRB home page: "Официальный курс c 05.11.2026" and rows "<h12>USD</h12> … <h12>16.1000</h12>". */
export function parsePrb(html: string): FetchedRate[] {
  const date = ddmmyyyyToIso(
    /Официальный курс[\s\S]{0,200}?c(?:&nbsp;|\s)*(\d{2}\.\d{2}\.\d{4})/.exec(html)?.[1] ?? '',
  );
  if (!date) throw new Error('prb: no date');
  const rates: FetchedRate[] = [];
  for (const base of ['USD', 'EUR'] as const) {
    const value = new RegExp(
      `<h12>${base}</h12>\\s*</td>\\s*<td[^>]*>\\s*<h12>([\\d.]+)</h12>`,
    ).exec(html)?.[1];
    if (value && RATE.test(value))
      rates.push({ date, base, quote: 'PRB', rate: value, source: 'prb' });
  }
  if (!rates.some((r) => r.base === 'USD')) throw new Error('prb: USD missing');
  return rates;
}
