import {
  ATTR_PARAM_PREFIX,
  BODY_TYPES,
  CAR_CONDITIONS,
  COLORS,
  COUNTRIES,
  CURRENCIES,
  DRIVES,
  FUEL_TYPES,
  REGISTRATIONS,
  SEARCH_SORTS,
  STEERINGS,
  TRANSMISSIONS,
  type ListingType,
} from '@clickauto/shared';
import {
  createLoader,
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
  parseAsNativeArrayOf,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from 'nuqs/server';
import type { GetFilterConfigParams, SearchListingsParams } from '@/shared/api/generated/model';
import { placeParams, type Place } from '@/shared/lib/place';

/**
 * Feed filters live only in the URL, with the same names as GET /api/v1/listings
 * (docs/backend/04-api-guidelines.md). Brand and model of a single pair and the goods or service
 * category go into the path: /cars/toyota/camry, /goods/tires.
 */
export const feedParsers = {
  q: parseAsString,
  sort: parseAsStringLiteral(SEARCH_SORTS),
  country: parseAsStringLiteral(COUNTRIES),
  region: parseAsNativeArrayOf(parseAsString),
  city: parseAsNativeArrayOf(parseAsString),
  priceFrom: parseAsInteger,
  priceTo: parseAsInteger,
  priceCurrency: parseAsStringLiteral(CURRENCIES),
  negotiable: parseAsBoolean,
  posted: parseAsInteger,
  car: parseAsNativeArrayOf(parseAsString),
  condition: parseAsNativeArrayOf(parseAsStringLiteral(CAR_CONDITIONS)),
  bodyType: parseAsNativeArrayOf(parseAsStringLiteral(BODY_TYPES)),
  transmission: parseAsNativeArrayOf(parseAsStringLiteral(TRANSMISSIONS)),
  drive: parseAsNativeArrayOf(parseAsStringLiteral(DRIVES)),
  fuel: parseAsNativeArrayOf(parseAsStringLiteral(FUEL_TYPES)),
  steering: parseAsNativeArrayOf(parseAsStringLiteral(STEERINGS)),
  color: parseAsNativeArrayOf(parseAsStringLiteral(COLORS)),
  registration: parseAsNativeArrayOf(parseAsStringLiteral(REGISTRATIONS)),
  yearFrom: parseAsInteger,
  yearTo: parseAsInteger,
  mileageFrom: parseAsInteger,
  mileageTo: parseAsInteger,
  engineFrom: parseAsInteger,
  engineTo: parseAsInteger,
  powerFrom: parseAsInteger,
  powerTo: parseAsInteger,
  exchange: parseAsBoolean,
  category: parseAsString,
  compatModel: parseAsString,
  compatYear: parseAsInteger,
  servedBrand: parseAsNativeArrayOf(parseAsString),
  mobile: parseAsBoolean,
};

type Parsed = inferParserType<typeof feedParsers>;

/** Filter values; arrays are empty and scalars null when not set. */
export type FeedFilters = Parsed & {
  /** Category attributes: attr.diameter=17 → { diameter: ['17'] }. */
  attrs: Record<string, string[]>;
};

export const FEED_PATH: Record<ListingType, '/cars' | '/goods' | '/services'> = {
  car: '/cars',
  goods: '/goods',
  service: '/services',
};

export const FEED_PAGE_SIZE = 24;

const loadParsed = createLoader(feedParsers);
const serialize = createSerializer(feedParsers);

export type RawSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(raw: RawSearchParams | URLSearchParams): URLSearchParams {
  if (raw instanceof URLSearchParams) return raw;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      params.append(key, item);
    }
  }
  return params;
}

/** Reads filters from the URL query and the path parts of landing pages. */
export function readFeedFilters(
  raw: RawSearchParams | URLSearchParams,
  fromPath: { car?: string; category?: string } = {},
): FeedFilters {
  const params = toUrlSearchParams(raw);
  const parsed = loadParsed(params);
  const attrs: Record<string, string[]> = {};
  for (const [key, value] of params.entries()) {
    if (!key.startsWith(ATTR_PARAM_PREFIX) || !value) continue;
    const name = key.slice(ATTR_PARAM_PREFIX.length);
    (attrs[name] ??= []).push(value);
  }
  return {
    ...parsed,
    car: fromPath.car
      ? [fromPath.car, ...parsed.car.filter((c) => c !== fromPath.car)]
      : parsed.car,
    category: fromPath.category ?? parsed.category,
    attrs,
  };
}

export function emptyFilters(): FeedFilters {
  return readFeedFilters(new URLSearchParams());
}

type ParamKey = Exclude<keyof FeedFilters, 'attrs'>;

function isParamKey(param: string): param is ParamKey {
  return Object.hasOwn(feedParsers, param);
}

const attrName = (param: string): string | null =>
  param.startsWith(ATTR_PARAM_PREFIX) ? param.slice(ATTR_PARAM_PREFIX.length) : null;

/**
 * Access by query parameter name, for the panel built from GET /catalog/filters.
 * attr.<key> parameters live in `attrs`; unknown names read as empty and write nothing.
 */
export function paramList(filters: FeedFilters, param: string): string[] {
  const attr = attrName(param);
  if (attr) return filters.attrs[attr] ?? [];
  if (!isParamKey(param)) return [];
  const value = filters[param];
  return Array.isArray(value) ? value.map(String) : [];
}

export function paramNumber(filters: FeedFilters, param: string): number | null {
  if (!isParamKey(param)) return null;
  const value = filters[param];
  return typeof value === 'number' ? value : null;
}

export function paramFlag(filters: FeedFilters, param: string): boolean {
  if (attrName(param)) return paramList(filters, param)[0] === 'true';
  return isParamKey(param) && filters[param] === true;
}

export type ParamValue = string[] | string | number | boolean | null;

/** Patch that sets one parameter; a flag that is off is dropped from the URL. */
export function patchParam(
  filters: FeedFilters,
  param: string,
  value: ParamValue,
): Partial<FeedFilters> {
  const attr = attrName(param);
  if (attr) {
    const list =
      value === true
        ? ['true']
        : Array.isArray(value)
          ? value
          : typeof value === 'string'
            ? [value]
            : [];
    const rest = Object.entries(filters.attrs).filter(([key]) => key !== attr);
    return { attrs: Object.fromEntries(list.length ? [...rest, [attr, list]] : rest) };
  }
  if (!isParamKey(param)) return {};
  return { [param]: value === false ? null : value } as Partial<FeedFilters>;
}

/** Patch that clears the parameters a field resets; "attr.*" clears every attribute. */
export function resetPatch(resets: readonly string[] | undefined): Partial<FeedFilters> {
  const empty = emptyFilters();
  const patch: Partial<FeedFilters> = {};
  for (const param of resets ?? []) {
    if (param === `${ATTR_PARAM_PREFIX}*`) patch.attrs = {};
    else if (isParamKey(param)) Object.assign(patch, { [param]: empty[param] });
  }
  return patch;
}

/** True when the URL itself names a place; then the place from the cookie is not applied. */
export function hasOwnPlace(filters: FeedFilters): boolean {
  return Boolean(filters.country || filters.region.length || filters.city.length);
}

/** Query of GET /listings for these filters. Place comes from the URL or else from the cookie. */
export function toSearchParams(
  type: ListingType,
  filters: FeedFilters,
  place: Place | null,
): SearchListingsParams {
  const params: Record<string, unknown> = { type };
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'attrs' || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    params[key] = value;
  }
  if (!hasOwnPlace(filters)) Object.assign(params, placeParams(place));
  if (params.priceFrom === undefined && params.priceTo === undefined) {
    delete params.priceCurrency;
    delete params.negotiable;
  }
  if (type === 'goods') {
    for (const [key, values] of Object.entries(filters.attrs)) {
      if (values.length) params[`${ATTR_PARAM_PREFIX}${key}`] = values.join(',');
    }
  }
  return params as SearchListingsParams;
}

/** Canonical feed URL: a single brand[:model] pair and the category go into the path. */
export function feedHref(type: ListingType, filters: FeedFilters): string {
  let path: string = FEED_PATH[type];
  let rest: FeedFilters = filters;
  if (type === 'car' && filters.car.length === 1) {
    const [brand, model] = (filters.car[0] ?? '').split(':');
    path += model ? `/${brand}/${model}` : `/${brand}`;
    rest = { ...filters, car: [] };
  }
  if (type !== 'car' && filters.category) {
    path += `/${filters.category}`;
    rest = { ...filters, category: null };
  }
  const { attrs, ...values } = rest;
  const query = new URLSearchParams(serialize(values).replace(/^\?/, ''));
  for (const [key, list] of Object.entries(attrs)) {
    for (const value of list) query.append(`${ATTR_PARAM_PREFIX}${key}`, value);
  }
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

/** Filters a feed of this type actually uses (others are ignored by the API and the chips). */
export function relevantFilters(type: ListingType, filters: FeedFilters): FeedFilters {
  const reset = emptyFilters();
  const keep = <K extends keyof FeedFilters>(...keys: K[]) =>
    Object.fromEntries(keys.map((key) => [key, filters[key]])) as Pick<FeedFilters, K>;
  const common = keep(
    'q',
    'sort',
    'country',
    'region',
    'city',
    'priceFrom',
    'priceTo',
    'priceCurrency',
    'negotiable',
    'posted',
  );
  if (type === 'car') {
    return {
      ...reset,
      ...common,
      ...keep(
        'car',
        'condition',
        'bodyType',
        'transmission',
        'drive',
        'fuel',
        'steering',
        'color',
        'registration',
        'yearFrom',
        'yearTo',
        'mileageFrom',
        'mileageTo',
        'engineFrom',
        'engineTo',
        'powerFrom',
        'powerTo',
        'exchange',
      ),
    };
  }
  if (type === 'goods') {
    return {
      ...reset,
      ...common,
      ...keep('category', 'condition', 'compatModel', 'compatYear', 'attrs'),
    };
  }
  return { ...reset, ...common, ...keep('category', 'servedBrand', 'mobile') };
}

/** Filters the panel resets; text, sort, place and the goods or service category stay. */
export function clearedFilters(type: ListingType, filters: FeedFilters): FeedFilters {
  return {
    ...emptyFilters(),
    q: filters.q,
    sort: filters.sort,
    country: filters.country,
    region: filters.region,
    city: filters.city,
    category: type === 'car' ? null : filters.category,
  };
}

/** Query of GET /catalog/filters: only goods depend on the category (it adds attribute filters). */
export function filterConfigParams(
  type: ListingType,
  filters: Pick<FeedFilters, 'category'>,
): GetFilterConfigParams {
  return type === 'goods' && filters.category ? { type, category: filters.category } : { type };
}
