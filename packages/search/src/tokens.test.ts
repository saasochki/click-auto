import { toUsdMinor, type UsdRates } from '@clickauto/shared';
import { describe, expect, it } from 'vitest';
import { COMPAT_YEARS_MAX } from './document';
import { attributeTokens, compatTokens, usdPrice } from './tokens';

// Rates in millionths (RATE_SCALE).
const rates: UsdRates = {
  usdMdl: 17_927_400n,
  eurMdl: 20_177_300n,
  usdPrb: 16_100_000n,
};

describe('compatTokens', () => {
  it('marks a model without years as fitting any year', () => {
    expect(compatTokens([{ modelId: 'm1' }], 2026)).toEqual(['m1', 'm1:any']);
  });

  it('lists every year of a closed range', () => {
    expect(compatTokens([{ modelId: 'm1', yearFrom: 2018, yearTo: 2020 }], 2026)).toEqual([
      'm1',
      'm1:2018',
      'm1:2019',
      'm1:2020',
    ]);
  });

  it('runs an open range up to next year', () => {
    const tokens = compatTokens([{ modelId: 'm1', yearFrom: 2025 }], 2026);
    expect(tokens).toEqual(['m1', 'm1:2025', 'm1:2026', 'm1:2027']);
  });

  it('caps a range at the maximum number of years', () => {
    const tokens = compatTokens([{ modelId: 'm1', yearTo: 2026 }], 2026);
    expect(tokens).toHaveLength(COMPAT_YEARS_MAX + 2);
    expect(tokens.at(-1)).toBe('m1:2026');
  });

  it('skips broken items and repeated tokens', () => {
    const value = [null, 'x', { yearFrom: 2020 }, { modelId: 'm1' }, { modelId: 'm1' }];
    expect(compatTokens(value, 2026)).toEqual(['m1', 'm1:any']);
    expect(compatTokens({ modelId: 'm1' }, 2026)).toEqual([]);
  });
});

describe('attributeTokens', () => {
  it('turns values into key=value tokens and keeps oem as text', () => {
    expect(
      attributeTokens({
        season: 'winter',
        width: [205, 215],
        studded: true,
        oem: 'A-1',
        quantity: 4,
      }),
    ).toEqual({
      attrs: ['season=winter', 'width=205', 'width=215', 'studded=true', 'quantity=4'],
      oem: 'A-1',
      quantity: 4,
    });
  });

  it('returns nothing for a non-object', () => {
    expect(attributeTokens(null)).toEqual({ attrs: [], oem: null, quantity: null });
    expect(attributeTokens(['a'])).toEqual({ attrs: [], oem: null, quantity: null });
  });
});

describe('usdPrice', () => {
  it('prices USD without rates', () => {
    expect(usdPrice(1_590_000n, 'USD', null)).toBe(1_590_000);
  });

  it('leaves other currencies unpriced until rates are known', () => {
    expect(usdPrice(4_230_000n, 'MDL', null)).toBeNull();
  });

  it('converts other currencies by the rates', () => {
    expect(usdPrice(4_230_000n, 'MDL', rates)).toBe(toUsdMinor(4_230_000n, 'MDL', rates));
  });

  it('has no price for a negotiable listing', () => {
    expect(usdPrice(null, 'USD', rates)).toBeNull();
    expect(usdPrice(1n, null, rates)).toBeNull();
  });
});
