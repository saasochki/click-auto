import { z } from 'zod';
import { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_MAX } from './constants';
import {
  BODY_TYPES,
  CAR_CONDITIONS,
  COLORS,
  CURRENCIES,
  DRIVES,
  FUEL_TYPES,
  GOODS_CONDITIONS,
  LISTING_TYPES,
  REGISTRATIONS,
  STEERINGS,
  TRANSMISSIONS,
} from './enums';

/**
 * Feed query: filters, sorting and paging of GET /api/v1/listings.
 * The site keeps the same parameters in its URL. Source: docs/analytics/05-filters.md,
 * docs/backend/04-api-guidelines.md.
 */

export const SEARCH_SORTS = [
  'date_desc',
  'price_asc',
  'price_desc',
  'mileage_asc',
  'year_desc',
] as const;
export type SearchSort = (typeof SEARCH_SORTS)[number];

/** "Дата выкладки": published within the last N days. */
export const POSTED_WITHIN_DAYS = [1, 3, 7, 30] as const;

/** Up to 5 "brand" or "brand:model" pairs in one search. */
export const CAR_PAIRS_MAX = 5;

/** Facets the feed can ask counts for. */
export const SEARCH_FACETS = [
  'brand',
  'model',
  'bodyType',
  'fuel',
  'transmission',
  'condition',
  'category',
] as const;
export type SearchFacet = (typeof SEARCH_FACETS)[number];

/** Prefix of category attribute filters: ?attr.diameter=17&attr.season=winter. */
export const ATTR_PARAM_PREFIX = 'attr.';

const slug = z.string().regex(/^[a-z0-9-]{1,80}$/);

/** A query parameter that may repeat: ?fuel=petrol&fuel=hybrid. */
const many = <T extends z.ZodTypeAny>(item: T, max = 30) =>
  z
    .preprocess((value) => (Array.isArray(value) ? value : [value]), z.array(item).max(max))
    .optional();

const flag = z
  .preprocess(
    (value) =>
      value === 'true' || value === '1' ? true : value === 'false' || value === '0' ? false : value,
    z.boolean(),
  )
  .optional();

const int = (max: number) => z.coerce.number().int().min(0).max(max).optional();

export const carPairSchema = z.string().regex(/^[a-z0-9-]{1,80}(:[a-z0-9-]{1,80})?$/, 'car_pair');

export const searchQuerySchema = z.object({
  type: z.enum(LISTING_TYPES),
  /** Free text: brand, model, city, title, OEM number. */
  q: z.string().trim().max(100).optional(),
  sort: z.enum(SEARCH_SORTS).optional(),
  limit: z.coerce.number().int().min(1).max(PAGE_LIMIT_MAX).default(PAGE_LIMIT_DEFAULT),
  cursor: z.string().max(200).optional(),
  facets: many(z.enum(SEARCH_FACETS), SEARCH_FACETS.length),

  region: many(slug),
  city: many(slug),
  /** Whole major units of priceCurrency. */
  priceFrom: int(1_000_000_000),
  priceTo: int(1_000_000_000),
  priceCurrency: z.enum(CURRENCIES).default('USD'),
  /** With a price range: also show "Договорная" listings. */
  negotiable: flag,
  posted: z.coerce
    .number()
    .int()
    .refine((value) => (POSTED_WITHIN_DAYS as readonly number[]).includes(value))
    .optional(),

  // Cars
  car: many(carPairSchema, CAR_PAIRS_MAX),
  condition: many(
    z.enum([...new Set([...CAR_CONDITIONS, ...GOODS_CONDITIONS])] as [string, ...string[]]),
  ),
  bodyType: many(z.enum(BODY_TYPES)),
  transmission: many(z.enum(TRANSMISSIONS)),
  drive: many(z.enum(DRIVES)),
  fuel: many(z.enum(FUEL_TYPES)),
  steering: many(z.enum(STEERINGS)),
  color: many(z.enum(COLORS)),
  registration: many(z.enum(REGISTRATIONS)),
  yearFrom: int(2100),
  yearTo: int(2100),
  mileageFrom: int(10_000_000),
  mileageTo: int(10_000_000),
  /** Engine volume in cm³. */
  engineFrom: int(20_000),
  engineTo: int(20_000),
  powerFrom: int(5_000),
  powerTo: int(5_000),
  exchange: flag,

  // Goods and services
  category: slug.optional(),
  /** Parts compatibility: model id and, optionally, the year of the buyer's car. */
  compatModel: z.string().uuid().optional(),
  compatYear: int(2100),
  /** Services: brands the provider works with. */
  servedBrand: many(slug),
  /** Services: "Выезд к клиенту". */
  mobile: flag,
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/** Parsed category attribute filters: key → accepted values. */
export type AttributeFilters = Record<string, string[]>;

/** Collects ?attr.<key>=<value> parameters; values may repeat or be comma-separated. */
export function readAttributeFilters(query: Record<string, unknown>): AttributeFilters {
  const result: AttributeFilters = {};
  for (const [key, raw] of Object.entries(query)) {
    if (!key.startsWith(ATTR_PARAM_PREFIX)) continue;
    const name = key.slice(ATTR_PARAM_PREFIX.length);
    if (!/^[a-z][a-z0-9_]{0,40}$/.test(name)) continue;
    const values = (Array.isArray(raw) ? raw : [raw])
      .flatMap((v) => (typeof v === 'string' ? v.split(',') : []))
      .map((v) => v.trim())
      .filter((v) => v.length > 0 && v.length <= 60)
      .slice(0, 20);
    if (values.length) result[name] = values;
  }
  return result;
}
