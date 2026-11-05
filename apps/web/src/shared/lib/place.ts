import type { Country } from '@clickauto/shared';

/**
 * Where the feeds search: everything, a country (PMR / Moldova), a region or a city.
 * Kept in the ca_place cookie (set from geolocation or the region picker) and applied to feeds
 * whose URL has no place of its own.
 */
export type Place =
  | { kind: 'all' }
  | { kind: 'country'; country: Country }
  | { kind: 'region'; slug: string }
  | { kind: 'city'; slug: string };

export const PLACE_COOKIE = 'ca_place';
/** A year: the choice is remembered until the user changes it. */
export const PLACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const SLUG = /^[a-z0-9-]{1,80}$/;

export function parsePlace(value: string | undefined | null): Place | null {
  if (!value) return null;
  if (value === 'all') return { kind: 'all' };
  const [kind, rest = ''] = value.split(':');
  if (kind === 'country' && (rest === 'pmr' || rest === 'md')) return { kind, country: rest };
  if ((kind === 'region' || kind === 'city') && SLUG.test(rest)) return { kind, slug: rest };
  return null;
}

export function serializePlace(place: Place): string {
  switch (place.kind) {
    case 'all':
      return 'all';
    case 'country':
      return `country:${place.country}`;
    default:
      return `${place.kind}:${place.slug}`;
  }
}

/** Search parameters of a place, in the API's names. */
export function placeParams(place: Place | null): {
  country?: Country;
  region?: string[];
  city?: string[];
} {
  if (!place) return {};
  if (place.kind === 'country') return { country: place.country };
  if (place.kind === 'region') return { region: [place.slug] };
  if (place.kind === 'city') return { city: [place.slug] };
  return {};
}

/** Writes the cookie in the browser. */
export function savePlace(place: Place): void {
  document.cookie = `${PLACE_COOKIE}=${encodeURIComponent(serializePlace(place))}; path=/; max-age=${PLACE_COOKIE_MAX_AGE}; samesite=lax`;
}
