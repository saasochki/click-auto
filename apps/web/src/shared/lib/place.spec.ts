import { describe, expect, it } from 'vitest';
import { parsePlace, placeParams, serializePlace, type Place } from './place';

describe('place cookie', () => {
  it.each<Place>([
    { kind: 'all' },
    { kind: 'country', country: 'pmr' },
    { kind: 'region', slug: 'camenca' },
    { kind: 'city', slug: 'tiraspol' },
  ])('round-trips %o', (place) => {
    expect(parsePlace(serializePlace(place))).toEqual(place);
  });

  it.each(['', 'country:ru', 'city:Bad Slug', 'street:x', undefined])('rejects %s', (value) => {
    expect(parsePlace(value)).toBeNull();
  });

  it('maps to API parameters', () => {
    expect(placeParams({ kind: 'city', slug: 'tiraspol' })).toEqual({ city: ['tiraspol'] });
    expect(placeParams({ kind: 'country', country: 'md' })).toEqual({ country: 'md' });
    expect(placeParams({ kind: 'all' })).toEqual({});
  });
});
