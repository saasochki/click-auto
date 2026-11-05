import {
  BODY_TYPES,
  CAR_CONDITIONS,
  CURRENCIES,
  FUEL_TYPES,
  GOODS_CONDITIONS,
  IMPORT_SOURCES,
  LISTING_ORIGINS,
  LISTING_TYPES,
  searchQuerySchema,
  TRANSMISSIONS,
} from '@clickauto/shared';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class SearchQueryDto extends createZodDto(searchQuerySchema) {}

const named = z.object({ slug: z.string(), name: z.string() });

/** Feed card: only what the list shows. The full listing comes from GET /listings/{id}. */
export const listingSummarySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(LISTING_TYPES),
  origin: z.enum(LISTING_ORIGINS),
  /** Imported listings: the "Источник: 999.md" badge. */
  sourceCode: z.enum(IMPORT_SOURCES).nullable(),
  title: z.string(),
  /** Always in the author's currency. */
  price: z.object({ amount: z.number().int(), currency: z.enum(CURRENCIES) }).nullable(),
  priceNegotiable: z.boolean(),
  city: named,
  publishedAt: z.string().datetime(),
  photo: z
    .object({
      url: z.string().url(),
      width: z.number().int().nullable(),
      height: z.number().int().nullable(),
    })
    .nullable(),
  photoCount: z.number().int(),
  car: z
    .object({
      brand: named.nullable(),
      modelName: z.string().nullable(),
      year: z.number().int(),
      mileageKm: z.number().int().nullable(),
      engineVolumeCc: z.number().int().nullable(),
      powerHp: z.number().int().nullable(),
      transmission: z.enum(TRANSMISSIONS).nullable(),
      bodyType: z.enum(BODY_TYPES).nullable(),
      fuelTypes: z.array(z.enum(FUEL_TYPES)),
      condition: z.enum(CAR_CONDITIONS),
    })
    .nullable(),
  goods: z
    .object({
      category: named,
      condition: z.enum(GOODS_CONDITIONS),
      quantity: z.number().int().nullable(),
    })
    .nullable(),
  service: z
    .object({
      category: named,
      workingHours: z.string().nullable(),
      mobileService: z.boolean(),
    })
    .nullable(),
});

export type ListingSummary = z.infer<typeof listingSummarySchema>;

export class ListingSummaryDto extends createZodDto(listingSummarySchema) {}

export class SearchResultDto extends createZodDto(
  z.object({
    items: z.array(listingSummarySchema),
    nextCursor: z.string().nullable(),
    /** Exact number of matching listings (up to 10 000). */
    total: z.number().int(),
    /** Counts by value for the requested ?facets=, e.g. {"bodyType": {"sedan": 120}}. */
    facets: z.record(z.string(), z.record(z.string(), z.number().int())).nullable(),
  }),
) {}

export class SearchCountDto extends createZodDto(z.object({ total: z.number().int() })) {}
