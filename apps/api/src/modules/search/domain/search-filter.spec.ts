import { searchQuerySchema } from '@clickauto/shared';
import { describe, expect, it } from 'vitest';
import { buildSearchFilter, decodeCursor, encodeCursor, searchSort } from './search-filter';

const now = new Date('2026-11-05T12:00:00Z');
const parse = (query: Record<string, unknown>) => searchQuerySchema.parse(query);

describe('buildSearchFilter', () => {
  it('filters cars by pairs, lists, ranges and place', () => {
    const query = parse({
      type: 'car',
      car: ['toyota:camry', 'kia'],
      fuel: ['petrol', 'hybrid'],
      yearFrom: '2015',
      yearTo: '2020',
      region: 'tiraspol',
      city: ['balti'],
      exchange: 'true',
    });
    expect(buildSearchFilter(query, {}, null, now)).toEqual([
      'type = "car"',
      '(regionSlug IN ["tiraspol"] OR citySlug IN ["balti"])',
      '(brandModel = "toyota:camry" OR brandSlug = "kia")',
      'fuel IN ["petrol", "hybrid"]',
      'year >= 2015',
      'year <= 2020',
      'exchangePossible = true',
    ]);
  });

  it('adds negotiable listings to a price range only on request', () => {
    const base = { type: 'car', priceTo: '45000' };
    expect(buildSearchFilter(parse(base), {}, { to: 4_500_000 }, now)).toContain(
      '(priceUsd <= 4500000)',
    );
    expect(
      buildSearchFilter(parse({ ...base, negotiable: '1' }), {}, { to: 4_500_000 }, now),
    ).toContain('((priceUsd <= 4500000) OR priceNegotiable = true)');
  });

  it('limits the publication date', () => {
    const filter = buildSearchFilter(parse({ type: 'service', posted: '7' }), {}, null, now);
    expect(filter).toContain(`publishedAt >= ${now.getTime() / 1000 - 7 * 86_400}`);
  });

  it('filters goods by category subtree, attributes and compatibility', () => {
    const query = parse({
      type: 'goods',
      category: 'tires',
      compatModel: '0193f6b2-0000-7000-8000-000000000001',
      compatYear: '2016',
    });
    const filter = buildSearchFilter(
      query,
      { diameter: ['17', '18'], season: ['wi"nter'] },
      null,
      now,
    );
    expect(filter).toEqual([
      'type = "goods"',
      'categorySlugs = "tires"',
      'attrs IN ["diameter=17", "diameter=18"]',
      'attrs IN ["season=wi\\"nter"]',
      'compat IN ["0193f6b2-0000-7000-8000-000000000001:2016", "0193f6b2-0000-7000-8000-000000000001:any"]',
    ]);
  });

  it('ignores car filters outside cars', () => {
    const filter = buildSearchFilter(
      parse({ type: 'service', fuel: 'petrol', servedBrand: 'bmw', mobile: 'true' }),
      {},
      null,
      now,
    );
    expect(filter).toEqual(['type = "service"', 'servedBrands IN ["bmw"]', 'mobileService = true']);
  });
});

describe('searchSort', () => {
  it('sorts by date unless there is text', () => {
    expect(searchSort({})).toEqual(['publishedAt:desc']);
    expect(searchSort({ q: 'camry' })).toBeUndefined();
    expect(searchSort({ q: 'camry', sort: 'price_asc' })).toEqual([
      'priceUsd:asc',
      'publishedAt:desc',
    ]);
  });
});

describe('cursor', () => {
  it('round-trips pages and rejects garbage', () => {
    expect(decodeCursor(encodeCursor(3))).toBe(3);
    expect(decodeCursor(undefined)).toBe(1);
    expect(decodeCursor('nope')).toBeNull();
  });
});
