import type {
  BodyType,
  CarCondition,
  Color,
  Currency,
  Drive,
  FuelType,
  GoodsCondition,
  ListingOrigin,
  ListingType,
  Registration,
  Steering,
  Transmission,
} from '@clickauto/shared';

/** Name of the Meilisearch index with active listings. */
export const LISTINGS_INDEX = 'listings';

/**
 * Search document: a projection of an active listing with everything the feed card needs,
 * so the feed is served from Meilisearch without hitting PostgreSQL.
 * Names of cities and categories are stored in both languages.
 */
export interface ListingDocument {
  id: string;
  type: ListingType;
  origin: ListingOrigin;
  /** Import source code (999md, makler, klaxon) for the "Источник" badge. */
  sourceCode: string | null;
  title: string;
  /** Unix seconds. */
  publishedAt: number;

  country: 'pmr' | 'md';
  regionSlug: string;
  citySlug: string;
  cityRu: string;
  cityRo: string;

  priceAmount: number | null;
  priceCurrency: Currency | null;
  priceNegotiable: boolean;
  /** Price in USD minor units by the latest rates: only for the filter and sorting. */
  priceUsd: number | null;

  cover: { key: string; width: number | null; height: number | null } | null;
  photoCount: number;

  // Cars
  brandSlug: string | null;
  brandName: string | null;
  modelSlug: string | null;
  /** Catalog model name or the seller's "Другая" name. */
  modelName: string | null;
  /** "brand:model" for multi-pair filters and model counts. */
  brandModel: string | null;
  year: number | null;
  mileageKm: number | null;
  bodyType: BodyType | null;
  transmission: Transmission | null;
  drive: Drive | null;
  fuel: FuelType[];
  engineVolumeCc: number | null;
  powerHp: number | null;
  steering: Steering | null;
  color: Color | null;
  registration: Registration | null;
  condition: CarCondition | GoodsCondition | null;
  exchangePossible: boolean;

  // Goods and services
  /** The category and its parents: filtering by a parent finds subcategories too. */
  categorySlugs: string[];
  categorySlug: string | null;
  categoryRu: string | null;
  categoryRo: string | null;
  /** Category attributes as "key=value" tokens. */
  attrs: string[];
  /** Part number (OEM) for text search. */
  oem: string | null;
  /** Parts compatibility tokens: "<modelId>" and "<modelId>:<year>". */
  compat: string[];
  /** Goods quantity in the set, for the card subtitle. */
  quantity: number | null;
  workingHours: string | null;
  mobileService: boolean;
  /** Slugs of brands a service works with. */
  servedBrands: string[];
}

/** Index settings. Changing them triggers a reindex of the whole index in Meilisearch. */
export const LISTINGS_INDEX_SETTINGS = {
  searchableAttributes: [
    'title',
    'brandName',
    'modelName',
    'oem',
    'categoryRu',
    'categoryRo',
    'cityRu',
    'cityRo',
  ],
  filterableAttributes: [
    'type',
    'origin',
    'country',
    'regionSlug',
    'citySlug',
    'priceUsd',
    'priceNegotiable',
    'publishedAt',
    'brandSlug',
    'brandModel',
    'year',
    'mileageKm',
    'bodyType',
    'transmission',
    'drive',
    'fuel',
    'engineVolumeCc',
    'powerHp',
    'steering',
    'color',
    'registration',
    'condition',
    'exchangePossible',
    'categorySlugs',
    'categorySlug',
    'attrs',
    'compat',
    'mobileService',
    'servedBrands',
  ],
  sortableAttributes: ['publishedAt', 'priceUsd', 'mileageKm', 'year'],
  pagination: { maxTotalHits: 10_000 },
  faceting: { maxValuesPerFacet: 500 },
};

/** Years expanded into compatibility tokens are capped to keep documents small. */
export const COMPAT_YEARS_MAX = 60;
