import { describe, expect, it } from 'vitest';
import {
  clearedFilters,
  feedHref,
  filterConfigParams,
  paramFlag,
  paramList,
  paramNumber,
  patchParam,
  readFeedFilters,
  resetPatch,
  toSearchParams,
} from './filters';

describe('feed filters', () => {
  it('reads repeated parameters, path parts and attributes', () => {
    const filters = readFeedFilters(
      { fuel: ['petrol', 'hybrid'], yearFrom: '2015', 'attr.diameter': ['17', '18'] },
      { car: 'toyota:camry' },
    );
    expect(filters.fuel).toEqual(['petrol', 'hybrid']);
    expect(filters.yearFrom).toBe(2015);
    expect(filters.car).toEqual(['toyota:camry']);
    expect(filters.attrs).toEqual({ diameter: ['17', '18'] });
    expect(filters.priceTo).toBeNull();
  });

  it('drops unknown enum values', () => {
    expect(readFeedFilters({ fuel: ['petrol', 'steam'] }).fuel).toEqual(['petrol']);
  });

  it('builds API parameters with the cookie place unless the URL has one', () => {
    const filters = readFeedFilters({ priceTo: '45000' });
    expect(toSearchParams('car', filters, { kind: 'city', slug: 'tiraspol' })).toEqual({
      type: 'car',
      priceTo: 45000,
      city: ['tiraspol'],
    });
    const own = readFeedFilters({ region: 'camenca' });
    expect(toSearchParams('car', own, { kind: 'city', slug: 'tiraspol' })).toEqual({
      type: 'car',
      region: ['camenca'],
    });
  });

  it('passes goods attributes as attr.<key>', () => {
    const filters = readFeedFilters({ 'attr.season': 'winter' }, { category: 'tires' });
    expect(toSearchParams('goods', filters, null)).toEqual({
      type: 'goods',
      category: 'tires',
      'attr.season': 'winter',
    });
  });

  it('puts a single pair and the category into the path', () => {
    expect(feedHref('car', readFeedFilters({ car: 'toyota:camry', fuel: 'diesel' }))).toBe(
      '/cars/toyota/camry?fuel=diesel',
    );
    expect(feedHref('car', readFeedFilters({ car: ['bmw', 'kia:rio'] }))).toBe(
      '/cars?car=bmw&car=kia%3Ario',
    );
    expect(
      feedHref('goods', readFeedFilters({ 'attr.season': 'winter' }, { category: 'tires' })),
    ).toBe('/goods/tires?attr.season=winter');
  });

  it('resets filters but keeps text, place and category', () => {
    const filters = readFeedFilters(
      { q: 'r16', city: 'bender', condition: 'new' },
      { category: 'tires' },
    );
    const cleared = clearedFilters('goods', filters);
    expect(cleared).toMatchObject({ q: 'r16', city: ['bender'], category: 'tires', condition: [] });
  });
});

describe('access by parameter name', () => {
  const filters = readFeedFilters({
    fuel: ['petrol', 'hybrid'],
    yearFrom: '2015',
    exchange: 'true',
    'attr.season': 'winter',
    'attr.studded': 'true',
  });

  it('reads lists, numbers and flags, attributes included', () => {
    expect(paramList(filters, 'fuel')).toEqual(['petrol', 'hybrid']);
    expect(paramList(filters, 'attr.season')).toEqual(['winter']);
    expect(paramNumber(filters, 'yearFrom')).toBe(2015);
    expect(paramFlag(filters, 'exchange')).toBe(true);
    expect(paramFlag(filters, 'attr.studded')).toBe(true);
    expect(paramList(filters, 'unknown')).toEqual([]);
  });

  it('writes parameters and drops flags that are off', () => {
    expect(patchParam(filters, 'yearTo', 2020)).toEqual({ yearTo: 2020 });
    expect(patchParam(filters, 'exchange', false)).toEqual({ exchange: null });
    expect(patchParam(filters, 'attr.season', ['summer'])).toEqual({
      attrs: { studded: ['true'], season: ['summer'] },
    });
    expect(patchParam(filters, 'attr.studded', false)).toEqual({ attrs: { season: ['winter'] } });
    expect(patchParam(filters, 'unknown', 1)).toEqual({});
  });

  it('clears what a field resets', () => {
    expect(resetPatch(['attr.*', 'compatModel', 'compatYear'])).toEqual({
      attrs: {},
      compatModel: null,
      compatYear: null,
    });
    expect(resetPatch(undefined)).toEqual({});
  });

  it('asks the config by category only for goods', () => {
    expect(filterConfigParams('goods', { category: 'tires' })).toEqual({
      type: 'goods',
      category: 'tires',
    });
    expect(filterConfigParams('service', { category: 'towing' })).toEqual({ type: 'service' });
  });
});
