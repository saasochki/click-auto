import type { AttributeFilters, SearchFacet, SearchQuery, SearchSort } from '@clickauto/shared';

/** Meilisearch string literal: quotes and backslashes are escaped. */
const lit = (value: string): string => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const inList = (field: string, values: readonly string[]): string =>
  `${field} IN [${values.map(lit).join(', ')}]`;

function range(field: string, from: number | undefined, to: number | undefined): string[] {
  const parts: string[] = [];
  if (from !== undefined) parts.push(`${field} >= ${from}`);
  if (to !== undefined) parts.push(`${field} <= ${to}`);
  return parts;
}

export interface PriceBoundsUsd {
  /** USD minor units; undefined — open end. */
  from?: number;
  to?: number;
}

/**
 * Builds the Meilisearch filter for a feed query. Every condition is AND-ed; multi-values of one
 * parameter are OR-ed. Only active listings are in the index, so status is not filtered here.
 */
export function buildSearchFilter(
  query: SearchQuery,
  attributes: AttributeFilters,
  price: PriceBoundsUsd | null,
  now: Date,
): string[] {
  const filter: string[] = [`type = ${lit(query.type)}`];

  const places: string[] = [];
  if (query.country) places.push(`country = ${lit(query.country)}`);
  if (query.region?.length) places.push(inList('regionSlug', query.region));
  if (query.city?.length) places.push(inList('citySlug', query.city));
  if (places.length) filter.push(`(${places.join(' OR ')})`);

  if (price && (price.from !== undefined || price.to !== undefined)) {
    const bounds = range('priceUsd', price.from, price.to).join(' AND ');
    filter.push(query.negotiable ? `((${bounds}) OR priceNegotiable = true)` : `(${bounds})`);
  }

  if (query.posted) {
    filter.push(`publishedAt >= ${Math.floor(now.getTime() / 1000) - query.posted * 86_400}`);
  }

  if (query.type === 'car') {
    if (query.car?.length) {
      const pairs = query.car.map((pair) =>
        pair.includes(':') ? `brandModel = ${lit(pair)}` : `brandSlug = ${lit(pair)}`,
      );
      filter.push(`(${pairs.join(' OR ')})`);
    }
    const lists: [string, readonly string[] | undefined][] = [
      ['condition', query.condition],
      ['bodyType', query.bodyType],
      ['transmission', query.transmission],
      ['drive', query.drive],
      ['fuel', query.fuel],
      ['steering', query.steering],
      ['color', query.color],
      ['registration', query.registration],
    ];
    for (const [field, values] of lists) if (values?.length) filter.push(inList(field, values));
    filter.push(...range('year', query.yearFrom, query.yearTo));
    filter.push(...range('mileageKm', query.mileageFrom, query.mileageTo));
    filter.push(...range('engineVolumeCc', query.engineFrom, query.engineTo));
    filter.push(...range('powerHp', query.powerFrom, query.powerTo));
    if (query.exchange) filter.push('exchangePossible = true');
  } else {
    if (query.category) filter.push(`categorySlugs = ${lit(query.category)}`);
  }

  if (query.type === 'goods') {
    if (query.condition?.length) filter.push(inList('condition', query.condition));
    for (const [key, values] of Object.entries(attributes)) {
      filter.push(
        inList(
          'attrs',
          values.map((value) => `${key}=${value}`),
        ),
      );
    }
    if (query.compatModel) {
      filter.push(
        query.compatYear !== undefined
          ? inList('compat', [
              `${query.compatModel}:${query.compatYear}`,
              `${query.compatModel}:any`,
            ])
          : `compat = ${lit(query.compatModel)}`,
      );
    }
  }

  if (query.type === 'service') {
    if (query.servedBrand?.length) filter.push(inList('servedBrands', query.servedBrand));
    if (query.mobile) filter.push('mobileService = true');
  }

  return filter;
}

const SORTS: Record<SearchSort, string[]> = {
  date_desc: ['publishedAt:desc'],
  price_asc: ['priceUsd:asc', 'publishedAt:desc'],
  price_desc: ['priceUsd:desc', 'publishedAt:desc'],
  mileage_asc: ['mileageKm:asc', 'publishedAt:desc'],
  year_desc: ['year:desc', 'publishedAt:desc'],
};

/** Text search without an explicit sort ranks by relevance; otherwise newest first. */
export function searchSort(query: Pick<SearchQuery, 'q' | 'sort'>): string[] | undefined {
  if (query.sort) return SORTS[query.sort];
  return query.q ? undefined : SORTS.date_desc;
}

export const FACET_FIELDS: Record<SearchFacet, string> = {
  brand: 'brandSlug',
  model: 'brandModel',
  bodyType: 'bodyType',
  fuel: 'fuel',
  transmission: 'transmission',
  condition: 'condition',
  category: 'categorySlug',
};

/** Opaque page cursor. */
export function encodeCursor(page: number): string {
  return Buffer.from(JSON.stringify({ p: page })).toString('base64url');
}

export function decodeCursor(cursor: string | undefined): number | null {
  if (!cursor) return 1;
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as { p?: unknown };
    return typeof value.p === 'number' && Number.isInteger(value.p) && value.p >= 1
      ? value.p
      : null;
  } catch {
    return null;
  }
}
