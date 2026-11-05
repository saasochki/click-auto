import { z } from 'zod';
import { LISTING_DESCRIPTION_MAX, LISTING_PHOTOS_MAX } from './constants';
import {
  BODY_TYPES,
  CAR_CONDITIONS,
  COLORS,
  CURRENCIES,
  DRIVES,
  FUEL_TYPES,
  GOODS_CONDITIONS,
  REGISTRATIONS,
  STEERINGS,
  TRANSMISSIONS,
} from './enums';
import { phoneSchema } from './schemas';

/** Listing input schemas, shared by the form on the site and the API. Docs: 05-filters.md, 08-dictionaries.md. */

const uuid = z.string().uuid();
const currentYear = new Date().getUTCFullYear();

export const priceInputSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.enum(CURRENCIES),
});

const commonFields = {
  description: z.string().trim().max(LISTING_DESCRIPTION_MAX).default(''),
  price: priceInputSchema.nullable().default(null),
  priceNegotiable: z.boolean().default(false),
  cityId: uuid,
  contactPhone: phoneSchema.nullable().default(null),
  photoIds: z.array(uuid).max(LISTING_PHOTOS_MAX).default([]),
};

export const carDetailsSchema = z
  .object({
    modelId: uuid.nullable().default(null),
    /** Model "Другая": brand from the catalog, model as text. */
    brandId: uuid.nullable().default(null),
    customModelName: z.string().trim().min(1).max(60).nullable().default(null),
    generationId: uuid.nullable().default(null),
    year: z
      .number()
      .int()
      .min(1900)
      .max(currentYear + 1),
    mileageKm: z.number().int().nonnegative().max(5_000_000).nullable().default(null),
    bodyType: z.enum(BODY_TYPES).nullable().default(null),
    transmission: z.enum(TRANSMISSIONS).nullable().default(null),
    drive: z.enum(DRIVES).nullable().default(null),
    fuelTypes: z.array(z.enum(FUEL_TYPES)).max(FUEL_TYPES.length).default([]),
    engineVolumeCc: z.number().int().positive().max(20_000).nullable().default(null),
    powerHp: z.number().int().positive().max(3000).nullable().default(null),
    steering: z.enum(STEERINGS).nullable().default(null),
    color: z.enum(COLORS).nullable().default(null),
    registration: z.enum(REGISTRATIONS).nullable().default(null),
    condition: z.enum(CAR_CONDITIONS),
    ownersCount: z.number().int().nonnegative().max(99).nullable().default(null),
    vin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'vin_format')
      .nullable()
      .default(null),
    exchangePossible: z.boolean().default(false),
  })
  .refine((car) => car.modelId !== null || (car.brandId !== null && car.customModelName !== null), {
    message: 'model_required',
    path: ['modelId'],
  });

export const compatibleModelSchema = z
  .object({
    modelId: uuid,
    yearFrom: z
      .number()
      .int()
      .min(1900)
      .max(currentYear + 1)
      .nullable()
      .default(null),
    yearTo: z
      .number()
      .int()
      .min(1900)
      .max(currentYear + 1)
      .nullable()
      .default(null),
  })
  .refine((m) => m.yearFrom === null || m.yearTo === null || m.yearFrom <= m.yearTo, {
    message: 'year_range',
  });

export const attributeValueSchema = z.union([
  z.number(),
  z.string().max(200),
  z.boolean(),
  z.array(z.string().max(100)).max(50),
]);

export const goodsDetailsSchema = z.object({
  categoryId: uuid,
  condition: z.enum(GOODS_CONDITIONS),
  /** Validated against the category attributes on the server. */
  attributes: z.record(z.string(), attributeValueSchema).default({}),
  compatibleModels: z.array(compatibleModelSchema).max(50).default([]),
});

export const serviceDetailsSchema = z.object({
  categoryId: uuid,
  address: z.string().trim().max(200).nullable().default(null),
  workingHours: z.string().trim().max(200).nullable().default(null),
  mobileService: z.boolean().default(false),
  servedBrands: z.array(uuid).max(100).default([]),
});

const titleSchema = z.string().trim().min(3).max(120);

export const carListingInputSchema = z.object({
  type: z.literal('car'),
  ...commonFields,
  car: carDetailsSchema,
});

export const goodsListingInputSchema = z.object({
  type: z.literal('goods'),
  title: titleSchema,
  ...commonFields,
  goods: goodsDetailsSchema,
});

export const serviceListingInputSchema = z.object({
  type: z.literal('service'),
  title: titleSchema,
  ...commonFields,
  service: serviceDetailsSchema,
});

export const listingInputSchema = z.discriminatedUnion('type', [
  carListingInputSchema,
  goodsListingInputSchema,
  serviceListingInputSchema,
]);

export type ListingInput = z.infer<typeof listingInputSchema>;
export type CarDetailsInput = z.infer<typeof carDetailsSchema>;

/** Price is either set or "Договорная" — never both missing (invariant 2 of the domain model). */
export function hasValidPrice(input: { price: unknown; priceNegotiable: boolean }): boolean {
  return input.priceNegotiable || input.price !== null;
}
