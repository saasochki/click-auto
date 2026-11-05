import {
  BODY_TYPES,
  CAR_CONDITIONS,
  COLORS,
  CURRENCIES,
  DRIVES,
  FUEL_TYPES,
  GOODS_CONDITIONS,
  IMPORT_SOURCES,
  LISTING_ORIGINS,
  LISTING_STATUSES,
  LISTING_TYPES,
  carListingInputSchema,
  goodsListingInputSchema,
  serviceListingInputSchema,
  PAGE_LIMIT_DEFAULT,
  PAGE_LIMIT_MAX,
  REGISTRATIONS,
  STEERINGS,
  TRANSMISSIONS,
} from '@clickauto/shared';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { photoSchema } from '../../media/dto';

export class CarListingInputDto extends createZodDto(carListingInputSchema) {}
export class GoodsListingInputDto extends createZodDto(goodsListingInputSchema) {}
export class ServiceListingInputDto extends createZodDto(serviceListingInputSchema) {}

const nullableEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).nullable();

export const listingSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(LISTING_TYPES),
  status: z.enum(LISTING_STATUSES),
  origin: z.enum(LISTING_ORIGINS),
  title: z.string(),
  description: z.string(),
  /** Always in the author's currency. */
  price: z.object({ amount: z.number().int(), currency: z.enum(CURRENCIES) }).nullable(),
  priceNegotiable: z.boolean(),
  city: z.object({
    id: z.string().uuid(),
    name: z.string(),
    regionId: z.string().uuid(),
    regionName: z.string(),
  }),
  photos: z.array(photoSchema),
  owner: z
    .object({
      id: z.string().uuid(),
      username: z.string().nullable(),
      name: z.string().nullable(),
      createdAt: z.string().datetime(),
    })
    .nullable(),
  /** Only in the full card; null in lists. */
  contactPhone: z.string().nullable(),
  contactName: z.string().nullable(),
  car: z
    .object({
      brand: z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() }).nullable(),
      model: z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() }).nullable(),
      customModelName: z.string().nullable(),
      year: z.number().int(),
      mileageKm: z.number().int().nullable(),
      bodyType: nullableEnum(BODY_TYPES),
      transmission: nullableEnum(TRANSMISSIONS),
      drive: nullableEnum(DRIVES),
      fuelTypes: z.array(z.enum(FUEL_TYPES)),
      engineVolumeCc: z.number().int().nullable(),
      powerHp: z.number().int().nullable(),
      steering: nullableEnum(STEERINGS),
      color: nullableEnum(COLORS),
      registration: nullableEnum(REGISTRATIONS),
      condition: z.enum(CAR_CONDITIONS),
      ownersCount: z.number().int().nullable(),
      vin: z.string().nullable(),
      exchangePossible: z.boolean(),
    })
    .nullable(),
  goods: z
    .object({
      category: z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() }),
      condition: z.enum(GOODS_CONDITIONS),
      attributes: z.record(z.string(), z.unknown()),
      compatibleModels: z.array(
        z.object({
          modelId: z.string().uuid(),
          yearFrom: z.number().int().nullable(),
          yearTo: z.number().int().nullable(),
        }),
      ),
    })
    .nullable(),
  service: z
    .object({
      category: z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() }),
      address: z.string().nullable(),
      workingHours: z.string().nullable(),
      mobileService: z.boolean(),
      servedBrands: z.array(z.string().uuid()),
    })
    .nullable(),
  /** Imported listings: where it came from. */
  source: z.object({ code: z.enum(IMPORT_SOURCES), url: z.string().url() }).nullable(),
  version: z.number().int(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ListingView = z.infer<typeof listingSchema>;

export class ListingDto extends createZodDto(listingSchema) {}

export class ListingPageDto extends createZodDto(
  z.object({ items: z.array(listingSchema), nextCursor: z.string().nullable() }),
) {}

export class MyListingsQueryDto extends createZodDto(
  z.object({
    status: z.enum(LISTING_STATUSES).optional(),
    type: z.enum(LISTING_TYPES).optional(),
    limit: z.coerce.number().int().min(1).max(PAGE_LIMIT_MAX).default(PAGE_LIMIT_DEFAULT),
    cursor: z.string().uuid().optional(),
  }),
) {}

export class MyListingCountsDto extends createZodDto(
  z.object({
    draft: z.number().int(),
    active: z.number().int(),
    hidden: z.number().int(),
    removed: z.number().int(),
    blocked: z.number().int(),
  }),
) {}
