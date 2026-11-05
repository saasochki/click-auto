import { describe, expect, it } from 'vitest';
import { parseRate, toUsdMinor, type UsdRates } from './money';

function rate(value: string): bigint {
  const parsed = parseRate(value);
  if (parsed === null) throw new Error(value);
  return parsed;
}

const rates: UsdRates = { usdMdl: rate('18.0644'), eurMdl: rate('20.1960'), usdPrb: rate('16.1') };

describe('parseRate', () => {
  it('reads decimals into millionths', () => {
    expect(parseRate('18.0644')).toBe(18_064_400n);
    expect(parseRate('16,1')).toBe(16_100_000n);
    expect(parseRate('1.12345678')).toBe(1_123_456n);
  });

  it.each(['', 'abc', '-1', '0', '1e3'])('rejects %s', (value) => {
    expect(parseRate(value)).toBeNull();
  });
});

describe('toUsdMinor', () => {
  it('keeps USD as is', () => {
    expect(toUsdMinor(1_590_000, 'USD', rates)).toBe(1_590_000);
  });

  it('converts lei and PMR rubles by their USD rates', () => {
    // 18 064.40 lei = 1 000.00 USD
    expect(toUsdMinor(1_806_440, 'MDL', rates)).toBe(100_000);
    // 1 610.00 rub. = 100.00 USD
    expect(toUsdMinor(161_000, 'PRB', rates)).toBe(10_000);
  });

  it('converts EUR through the leu cross rate', () => {
    // 100 EUR = 2019.60 lei = 111.80 USD
    expect(toUsdMinor(10_000, 'EUR', rates)).toBe(11_180);
  });

  it('accepts bigint amounts and rounds to the nearest cent', () => {
    expect(toUsdMinor(1n, 'MDL', rates)).toBe(0);
    expect(toUsdMinor(10n, 'MDL', rates)).toBe(1);
  });
});
