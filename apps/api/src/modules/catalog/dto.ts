import { ATTRIBUTE_TYPES, CATEGORY_KINDS, COUNTRIES } from '@clickauto/shared';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const brandSchema = z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() });
export class BrandDto extends createZodDto(brandSchema) {}

export const modelSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
});
export class ModelDto extends createZodDto(modelSchema) {}

export const attributeSchema = z.object({
  key: z.string(),
  type: z.enum(ATTRIBUTE_TYPES),
  options: z.array(z.string()).nullable(),
  unit: z.string().nullable(),
  required: z.boolean(),
  filterable: z.boolean(),
});

const categoryBase = z.object({
  id: z.string().uuid(),
  kind: z.enum(CATEGORY_KINDS),
  slug: z.string(),
  name: z.string(),
  parentId: z.string().uuid().nullable(),
  /** Own attributes plus attributes inherited from parents. */
  attributes: z.array(attributeSchema),
});

/** Flat list: the tree is rebuilt on the client by parentId (OpenAPI has no recursion here). */
export class CategoryDto extends createZodDto(categoryBase) {}

export const citySchema = z.object({ id: z.string().uuid(), slug: z.string(), name: z.string() });
export const regionSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  country: z.enum(COUNTRIES),
  cities: z.array(citySchema),
});
export class RegionDto extends createZodDto(regionSchema) {}

export class NearestCityDto extends createZodDto(
  z.object({
    city: citySchema,
    region: regionSchema.omit({ cities: true }),
    distanceKm: z.number(),
  }),
) {}

export class NearestCityQueryDto extends createZodDto(
  z.object({ lat: z.coerce.number().min(-90).max(90), lng: z.coerce.number().min(-180).max(180) }),
) {}

export class CategoriesQueryDto extends createZodDto(z.object({ kind: z.enum(CATEGORY_KINDS) })) {}
