import type { Prisma, PrismaClient } from '@clickauto/db';
import { toUsdMinor, type Currency, type UsdRates } from '@clickauto/shared';
import { COMPAT_YEARS_MAX, type ListingDocument } from './document';

const include = {
  car: { include: { brand: true, model: { include: { brand: true } } } },
  goods: { include: { category: { include: { parent: true } } } },
  service: { include: { category: { include: { parent: true } } } },
  city: { include: { region: true } },
  photos: { orderBy: { position: 'asc' }, include: { media: true } },
  external: { include: { source: true } },
} satisfies Prisma.ListingInclude;

type Row = Prisma.ListingGetPayload<{ include: typeof include }>;

/** Attribute keys that are not equality filters. */
const TEXT_ATTRIBUTES = new Set(['oem']);

export interface BuiltDocuments {
  /** Active listings to upsert. */
  documents: ListingDocument[];
  /** Ids that must not be in the index: not active or deleted. */
  removeIds: string[];
}

/** Loads listings by id and turns active ones into search documents. */
export async function buildListingDocuments(
  prisma: PrismaClient,
  ids: string[],
  rates: UsdRates | null,
): Promise<BuiltDocuments> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return { documents: [], removeIds: [] };
  const rows = await prisma.listing.findMany({ where: { id: { in: unique } }, include });
  const active = rows.filter((row) => row.status === 'active');
  const activeIds = new Set(active.map((row) => row.id));
  const servedBrandIds = [...new Set(active.flatMap((row) => row.service?.servedBrands ?? []))];
  const brands = servedBrandIds.length
    ? await prisma.brand.findMany({ where: { id: { in: servedBrandIds } } })
    : [];
  const brandSlugs = new Map(brands.map((brand) => [brand.id, brand.slug]));
  return {
    documents: active.map((row) => toDocument(row, rates, brandSlugs)),
    removeIds: unique.filter((id) => !activeIds.has(id)),
  };
}

function categoryOf(category: {
  slug: string;
  nameRu: string;
  nameRo: string;
  parent: { slug: string } | null;
}) {
  return {
    categorySlugs: category.parent ? [category.slug, category.parent.slug] : [category.slug],
    categorySlug: category.slug,
    categoryRu: category.nameRu,
    categoryRo: category.nameRo,
  };
}

function compatTokens(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  const tokens: string[] = [];
  const thisYear = new Date().getUTCFullYear();
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const { modelId, yearFrom, yearTo } = item as Record<string, unknown>;
    if (typeof modelId !== 'string') continue;
    tokens.push(modelId);
    // No years means "fits every year": the plain model token is enough.
    if (typeof yearFrom !== 'number' && typeof yearTo !== 'number') {
      tokens.push(`${modelId}:any`);
      continue;
    }
    const from = typeof yearFrom === 'number' ? yearFrom : thisYear - COMPAT_YEARS_MAX;
    const to = typeof yearTo === 'number' ? yearTo : thisYear + 1;
    for (let year = Math.max(from, to - COMPAT_YEARS_MAX); year <= to; year += 1) {
      tokens.push(`${modelId}:${year}`);
    }
  }
  return [...new Set(tokens)];
}

function attributeTokens(value: Prisma.JsonValue): {
  attrs: string[];
  oem: string | null;
  quantity: number | null;
} {
  const attrs: string[] = [];
  let oem: string | null = null;
  let quantity: number | null = null;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, raw] of Object.entries(value)) {
      if (key === 'oem' && typeof raw === 'string') oem = raw;
      if (key === 'quantity' && typeof raw === 'number') quantity = raw;
      if (TEXT_ATTRIBUTES.has(key)) continue;
      const values = Array.isArray(raw) ? raw : [raw];
      for (const item of values) {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          attrs.push(`${key}=${String(item)}`);
        }
      }
    }
  }
  return { attrs, oem, quantity };
}

/** USD needs no rates; other currencies stay unpriced until rates are known. */
function usdPrice(
  amount: bigint | null,
  currency: Currency | null,
  rates: UsdRates | null,
): number | null {
  if (amount === null || !currency) return null;
  if (currency === 'USD') return Number(amount);
  return rates ? toUsdMinor(amount, currency, rates) : null;
}

function toDocument(
  row: Row,
  rates: UsdRates | null,
  brandSlugs: Map<string, string>,
): ListingDocument {
  const car = row.car;
  const brand = car?.model?.brand ?? car?.brand ?? null;
  const modelSlug = car?.model?.slug ?? null;
  const category = row.goods?.category ?? row.service?.category ?? null;
  const goodsAttrs = row.goods ? attributeTokens(row.goods.attributes) : null;
  const cover = row.photos[0]?.media ?? null;
  const price = row.priceAmount !== null && row.priceCurrency ? row.priceAmount : null;

  return {
    id: row.id,
    type: row.type,
    origin: row.origin,
    sourceCode: row.external?.source.code ?? null,
    title: row.title,
    publishedAt: Math.floor((row.publishedAt ?? row.createdAt).getTime() / 1000),

    country: row.city.region.country,
    regionSlug: row.city.region.slug,
    citySlug: row.city.slug,
    cityRu: row.city.nameRu,
    cityRo: row.city.nameRo,

    priceAmount: price === null ? null : Number(price),
    priceCurrency: price === null ? null : row.priceCurrency,
    priceNegotiable: row.priceNegotiable,
    priceUsd: usdPrice(price, row.priceCurrency, rates),

    cover: cover ? { key: cover.storageKey, width: cover.width, height: cover.height } : null,
    photoCount: row.photos.length,

    brandSlug: brand?.slug ?? null,
    brandName: brand?.name ?? null,
    modelSlug,
    modelName: car?.model?.name ?? car?.customModelName ?? null,
    brandModel: brand && modelSlug ? `${brand.slug}:${modelSlug}` : null,
    year: car?.year ?? null,
    mileageKm: car?.mileageKm ?? null,
    bodyType: car?.bodyType ?? null,
    transmission: car?.transmission ?? null,
    drive: car?.drive ?? null,
    fuel: car?.fuelTypes ?? [],
    engineVolumeCc: car?.engineVolumeCc ?? null,
    powerHp: car?.powerHp ?? null,
    steering: car?.steering ?? null,
    color: car?.color ?? null,
    registration: car?.registration ?? null,
    condition: car?.condition ?? row.goods?.condition ?? null,
    exchangePossible: car?.exchangePossible ?? false,

    ...(category
      ? categoryOf(category)
      : { categorySlugs: [], categorySlug: null, categoryRu: null, categoryRo: null }),
    attrs: goodsAttrs?.attrs ?? [],
    oem: goodsAttrs?.oem ?? null,
    compat: row.goods ? compatTokens(row.goods.compatibleModels) : [],
    quantity: goodsAttrs?.quantity ?? null,
    workingHours: row.service?.workingHours ?? null,
    mobileService: row.service?.mobileService ?? false,
    servedBrands: (row.service?.servedBrands ?? []).flatMap((id) => {
      const slug = brandSlugs.get(id);
      return slug ? [slug] : [];
    }),
  };
}
