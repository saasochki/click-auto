import { Injectable } from '@nestjs/common';
import type { CategoryAttribute, CategoryKind } from '@clickauto/db';
import type { Locale } from '@clickauto/shared';
import type { z } from 'zod';
import { AppError } from '../../common/problem';
import { pickName } from '../../common/locale';
import { PrismaService } from '../../prisma/prisma.service';
import type { attributeSchema, BrandDto, CategoryDto, ModelDto, RegionDto } from './dto';

type Attribute = z.infer<typeof attributeSchema>;

const toAttribute = (a: CategoryAttribute): Attribute => ({
  key: a.key,
  type: a.type,
  options: Array.isArray(a.options) ? (a.options as string[]) : null,
  unit: a.unit,
  required: a.required,
  filterable: a.filterable,
});

/** Great-circle distance in km. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** Farther than this from every known city — the user picks the region manually. */
const NEAREST_CITY_MAX_KM = 60;

/** Public service of the catalog module: other modules read dictionaries only through it. */
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async brands(): Promise<BrandDto[]> {
    return this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ sort: 'asc' }, { name: 'asc' }],
      select: { id: true, slug: true, name: true },
    });
  }

  async models(brandId: string): Promise<ModelDto[]> {
    return this.prisma.model.findMany({
      where: { brandId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, brandId: true, slug: true, name: true },
    });
  }

  async categories(kind: CategoryKind, locale: Locale): Promise<CategoryDto[]> {
    const rows = await this.prisma.category.findMany({
      where: { kind },
      orderBy: [{ sort: 'asc' }],
      include: { attributes: { orderBy: { sort: 'asc' } } },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    const inherited = (id: string | null): Attribute[] => {
      const row = id ? byId.get(id) : undefined;
      if (!row) return [];
      const own = row.attributes.map(toAttribute);
      const ownKeys = new Set(own.map((a) => a.key));
      return [...inherited(row.parentId).filter((a) => !ownKeys.has(a.key)), ...own];
    };
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      slug: row.slug,
      name: pickName(locale, row),
      parentId: row.parentId,
      attributes: inherited(row.id),
    }));
  }

  /** Attributes that apply to a category (inherited from parents). Throws 422 for unknown ids. */
  async categoryAttributes(categoryId: string, kind: CategoryKind): Promise<Attribute[]> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.kind !== kind) {
      throw new AppError(422, 'validation_failed', [
        { field: `${kind}.categoryId`, code: 'unknown' },
      ]);
    }
    const all = await this.categories(kind, 'ru');
    return all.find((c) => c.id === categoryId)?.attributes ?? [];
  }

  async regions(locale: Locale): Promise<RegionDto[]> {
    const rows = await this.prisma.region.findMany({
      orderBy: { sort: 'asc' },
      include: { cities: { orderBy: { nameRu: 'asc' } } },
    });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: pickName(locale, r),
      country: r.country,
      cities: r.cities.map((c) => ({ id: c.id, slug: c.slug, name: pickName(locale, c) })),
    }));
  }

  async nearestCity(lat: number, lng: number, locale: Locale) {
    const cities = await this.prisma.city.findMany({ include: { region: true } });
    let best: { city: (typeof cities)[number]; km: number } | null = null;
    for (const city of cities) {
      const km = haversineKm(lat, lng, city.lat, city.lng);
      if (!best || km < best.km) best = { city, km };
    }
    if (!best || best.km > NEAREST_CITY_MAX_KM) throw new AppError(404, 'city_not_found');
    const { city } = best;
    return {
      city: { id: city.id, slug: city.slug, name: pickName(locale, city) },
      region: {
        id: city.region.id,
        slug: city.region.slug,
        name: pickName(locale, city.region),
        country: city.region.country,
      },
      distanceKm: Math.round(best.km * 10) / 10,
    };
  }

  /** City and region names for listing cards. */
  async cityLabels(
    ids: string[],
    locale: Locale,
  ): Promise<Map<string, { id: string; name: string; regionId: string; regionName: string }>> {
    const rows = await this.prisma.city.findMany({
      where: { id: { in: [...new Set(ids)] } },
      include: { region: true },
    });
    return new Map(
      rows.map((c) => [
        c.id,
        {
          id: c.id,
          name: pickName(locale, c),
          regionId: c.regionId,
          regionName: pickName(locale, c.region),
        },
      ]),
    );
  }

  /** Names for car details on the card. */
  async carLabels(modelIds: string[], brandIds: string[]) {
    const [models, brands] = await Promise.all([
      this.prisma.model.findMany({ where: { id: { in: modelIds } }, include: { brand: true } }),
      this.prisma.brand.findMany({ where: { id: { in: brandIds } } }),
    ]);
    return {
      models: new Map(models.map((m) => [m.id, { name: m.name, slug: m.slug, brand: m.brand }])),
      brands: new Map(brands.map((b) => [b.id, b])),
    };
  }

  async categoryLabels(
    ids: string[],
    locale: Locale,
  ): Promise<Map<string, { id: string; slug: string; name: string }>> {
    const rows = await this.prisma.category.findMany({ where: { id: { in: [...new Set(ids)] } } });
    return new Map(rows.map((c) => [c.id, { id: c.id, slug: c.slug, name: pickName(locale, c) }]));
  }

  async cityExists(cityId: string): Promise<boolean> {
    return (await this.prisma.city.count({ where: { id: cityId } })) > 0;
  }

  /** Brand and model names for a car title: "Марка Модель, год". */
  async carNames(
    modelId: string | null,
    brandId: string | null,
  ): Promise<{ brand: string; model: string | null; brandId: string } | null> {
    if (modelId) {
      const model = await this.prisma.model.findUnique({
        where: { id: modelId },
        include: { brand: true },
      });
      return model ? { brand: model.brand.name, model: model.name, brandId: model.brandId } : null;
    }
    if (brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
      return brand ? { brand: brand.name, model: null, brandId: brand.id } : null;
    }
    return null;
  }
}
