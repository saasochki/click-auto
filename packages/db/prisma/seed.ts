/**
 * Idempotent seed of approved dictionaries: regions, cities, goods and service categories,
 * import sources. Safe to run repeatedly. Never run it against staging or production by hand.
 */
import { PrismaClient, type CategoryKind } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import { GOODS_CATEGORIES, REGIONS, SERVICE_CATEGORIES, type CategorySeed } from './seed-data';

const prisma = new PrismaClient();

async function seedRegions(): Promise<void> {
  for (const [index, region] of REGIONS.entries()) {
    const saved = await prisma.region.upsert({
      where: { slug: region.slug },
      update: { nameRu: region.ru, nameRo: region.ro, country: region.country, sort: index },
      create: {
        id: uuidv7(),
        slug: region.slug,
        nameRu: region.ru,
        nameRo: region.ro,
        country: region.country,
        sort: index,
      },
    });
    for (const city of region.cities) {
      await prisma.city.upsert({
        where: { slug: city.slug },
        update: {
          nameRu: city.ru,
          nameRo: city.ro,
          lat: city.lat,
          lng: city.lng,
          regionId: saved.id,
        },
        create: {
          id: uuidv7(),
          slug: city.slug,
          nameRu: city.ru,
          nameRo: city.ro,
          lat: city.lat,
          lng: city.lng,
          regionId: saved.id,
        },
      });
    }
  }
}

async function seedCategory(
  kind: CategoryKind,
  item: CategorySeed,
  sort: number,
  parentId: string | null,
): Promise<void> {
  const saved = await prisma.category.upsert({
    where: { kind_slug: { kind, slug: item.slug } },
    update: { nameRu: item.ru, nameRo: item.ro, sort, parentId },
    create: {
      id: uuidv7(),
      kind,
      slug: item.slug,
      nameRu: item.ru,
      nameRo: item.ro,
      sort,
      parentId,
    },
  });
  for (const [index, attr] of (item.attributes ?? []).entries()) {
    const data = {
      type: attr.type,
      options: attr.options ?? undefined,
      unit: attr.unit ?? null,
      required: attr.required ?? false,
      sort: index,
    };
    await prisma.categoryAttribute.upsert({
      where: { categoryId_key: { categoryId: saved.id, key: attr.key } },
      update: data,
      create: { id: uuidv7(), categoryId: saved.id, key: attr.key, ...data },
    });
  }
  for (const [index, child] of (item.children ?? []).entries()) {
    await seedCategory(kind, child, index, saved.id);
  }
}

async function seedImportSources(): Promise<void> {
  const sources = [
    { code: '999md', baseUrl: 'https://999.md' },
    { code: 'makler', baseUrl: 'https://makler.md' },
    { code: 'klaxon', baseUrl: 'https://klaxon.md' },
  ];
  for (const source of sources) {
    await prisma.importSource.upsert({
      where: { code: source.code },
      update: { baseUrl: source.baseUrl },
      // Disabled until the adapter is ready; the schedule is set in the admin.
      create: { id: uuidv7(), ...source, isEnabled: false, schedule: '0 */6 * * *' },
    });
  }
}

async function main(): Promise<void> {
  await seedRegions();
  for (const [index, item] of GOODS_CATEGORIES.entries())
    await seedCategory('goods', item, index, null);
  for (const [index, item] of SERVICE_CATEGORIES.entries())
    await seedCategory('service', item, index, null);
  await seedImportSources();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
