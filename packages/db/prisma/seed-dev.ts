/**
 * Local development fixtures only. Never run against staging or production.
 * Users have fictional data on example.com. The brand list is a starter set for local work;
 * the real catalog is maintained in the admin.
 */
import { PrismaClient } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

const prisma = new PrismaClient();

const BRANDS: Record<string, { name: string; models: [string, string][] }> = {
  toyota: {
    name: 'Toyota',
    models: [
      ['camry', 'Camry'],
      ['rav4', 'RAV4'],
      ['corolla', 'Corolla'],
    ],
  },
  volkswagen: {
    name: 'Volkswagen',
    models: [
      ['passat', 'Passat'],
      ['golf', 'Golf'],
    ],
  },
  bmw: {
    name: 'BMW',
    models: [
      ['x5', 'X5'],
      ['3-series', '3 Series'],
    ],
  },
  skoda: {
    name: 'Skoda',
    models: [
      ['octavia', 'Octavia'],
      ['superb', 'Superb'],
    ],
  },
  'mercedes-benz': { name: 'Mercedes-Benz', models: [['e-class', 'E-Class']] },
};

const USERS = [
  { email: 'admin@example.com', username: 'dev_admin', name: 'Admin Dev', role: 'admin' as const },
  {
    email: 'moderator@example.com',
    username: 'dev_moderator',
    name: 'Moderator Dev',
    role: 'moderator' as const,
  },
  { email: 'ivan@example.com', username: 'ivan_auto', name: 'Иван', role: 'user' as const },
];

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('seed-dev must not run in production');

  for (const [index, [slug, brand]] of Object.entries(BRANDS).entries()) {
    const saved = await prisma.brand.upsert({
      where: { slug },
      update: { name: brand.name, sort: index },
      create: { id: uuidv7(), slug, name: brand.name, sort: index },
    });
    for (const [modelSlug, modelName] of brand.models) {
      await prisma.model.upsert({
        where: { brandId_slug: { brandId: saved.id, slug: modelSlug } },
        update: { name: modelName },
        create: { id: uuidv7(), brandId: saved.id, slug: modelSlug, name: modelName },
      });
    }
  }

  for (const user of USERS) {
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role },
      create: { id: uuidv7(), ...user },
    });
    await prisma.authIdentity.upsert({
      where: { provider_providerSubject: { provider: 'email', providerSubject: user.email } },
      update: {},
      create: { id: uuidv7(), userId: saved.id, provider: 'email', providerSubject: user.email },
    });
  }

  await seedListings();
}

/** Deterministic pseudo-random numbers: every run produces the same fixtures. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

const GOODS_FIXTURES = [
  {
    slug: 'tires-winter',
    title: 'Шины Nokian 205/55 R16, 4 шт.',
    attributes: { width: 205, profile: 55, diameter: 16, season: 'winter', quantity: 4 },
  },
  {
    slug: 'tires-summer',
    title: 'Шины Michelin 225/45 R17, комплект',
    attributes: { width: 225, profile: 45, diameter: 17, season: 'summer', quantity: 4 },
  },
  {
    slug: 'disks-alloy',
    title: 'Литые диски R17 5x112',
    attributes: { disk_diameter: 17, pcd: '5x112', disk_type: 'alloy', quantity: 4 },
  },
  {
    slug: 'brakes',
    title: 'Тормозные колодки передние',
    attributes: { oem: '04465-33450', part_type: 'original' },
  },
  { slug: 'dashcams', title: 'Видеорегистратор с двумя камерами', attributes: {} },
  { slug: 'engine-oils', title: 'Моторное масло 5W-30, 4 л', attributes: {} },
];

const SERVICE_FIXTURES = [
  { slug: 'diagnostics', title: 'Компьютерная диагностика двигателя', hours: 'Пн–Сб 9:00–19:00' },
  { slug: 'tire-service', title: 'Шиномонтаж и балансировка R13–R20', hours: 'Пн–Вс 8:00–20:00' },
  { slug: 'tow-truck', title: 'Эвакуатор по ПМР и Молдове', hours: 'Круглосуточно' },
  { slug: 'repair', title: 'Замена масла и фильтров', hours: 'Пн–Сб' },
];

/**
 * Fictional active listings of all three types for local feeds. Runs once: skipped when the
 * fixture owner already has listings. No photos — the feed shows a placeholder.
 * Afterwards run `pnpm --filter worker search:reindex`.
 */
async function seedListings(): Promise<void> {
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: 'ivan@example.com' } });
  if ((await prisma.listing.count({ where: { ownerId: owner.id } })) > 0) return;

  const rnd = random(42);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(rnd() * items.length)] as T;
  const cities = await prisma.city.findMany({
    where: { slug: { in: ['tiraspol', 'bender', 'ribnita', 'chisinau', 'balti', 'cahul'] } },
  });
  const models = await prisma.model.findMany({
    where: { brand: { slug: { in: Object.keys(BRANDS) } } },
    include: { brand: true },
  });
  const categories = await prisma.category.findMany();
  const category = (kind: 'goods' | 'service', slug: string) =>
    categories.find((c) => c.kind === kind && c.slug === slug);
  const now = Date.now();
  const publishedAt = (i: number) => new Date(now - i * 7 * 3_600_000);
  const base = {
    ownerId: owner.id,
    status: 'active' as const,
    description: 'Вымышленное объявление для локальной разработки.',
  };

  for (let i = 0; i < 36; i += 1) {
    const model = pick(models);
    const year = 2008 + Math.floor(rnd() * 17);
    const currency = pick(['USD', 'EUR', 'MDL', 'PRB'] as const);
    const usd = 4_000 + Math.floor(rnd() * 40) * 750;
    const factor = { USD: 1, EUR: 0.9, MDL: 18, PRB: 16 }[currency];
    const negotiable = i % 9 === 4;
    await prisma.listing.create({
      data: {
        ...base,
        id: uuidv7(),
        type: 'car',
        title: `${model.brand.name} ${model.name}, ${year}`,
        priceNegotiable: negotiable,
        priceAmount: negotiable ? null : BigInt(Math.round(usd * factor) * 100),
        priceCurrency: negotiable ? null : currency,
        cityId: pick(cities).id,
        publishedAt: publishedAt(i),
        car: {
          create: {
            modelId: model.id,
            year,
            mileageKm: (2026 - year) * (8_000 + Math.floor(rnd() * 12_000)),
            bodyType: pick(['sedan', 'wagon', 'suv', 'hatchback', 'crossover'] as const),
            transmission: pick(['manual', 'automatic', 'robot', 'cvt'] as const),
            drive: pick(['fwd', 'rwd', 'awd'] as const),
            fuelTypes: [pick(['petrol', 'diesel', 'hybrid', 'lpg'] as const)],
            engineVolumeCc: 1_200 + Math.floor(rnd() * 20) * 100,
            powerHp: 90 + Math.floor(rnd() * 200),
            steering: 'left',
            color: pick(['white', 'black', 'gray', 'silver', 'blue'] as const),
            registration: pick(['pmr', 'md', 'neutral'] as const),
            condition: pick(['used', 'used', 'used', 'new', 'needs_repair'] as const),
            exchangePossible: rnd() > 0.7,
          },
        },
      },
    });
  }

  for (let i = 0; i < 18; i += 1) {
    const item = GOODS_FIXTURES[i % GOODS_FIXTURES.length];
    const found = item && category('goods', item.slug);
    if (!item || !found) continue;
    await prisma.listing.create({
      data: {
        ...base,
        id: uuidv7(),
        type: 'goods',
        title: item.title,
        priceAmount: BigInt((200 + Math.floor(rnd() * 40) * 50) * 100),
        priceCurrency: pick(['PRB', 'MDL', 'USD'] as const),
        cityId: pick(cities).id,
        publishedAt: publishedAt(i),
        goods: {
          create: {
            categoryId: found.id,
            condition: rnd() > 0.5 ? 'new' : 'used',
            attributes: item.attributes,
          },
        },
      },
    });
  }

  for (let i = 0; i < 12; i += 1) {
    const item = SERVICE_FIXTURES[i % SERVICE_FIXTURES.length];
    const found = item && category('service', item.slug);
    if (!item || !found) continue;
    const towing = item.slug === 'tow-truck';
    await prisma.listing.create({
      data: {
        ...base,
        id: uuidv7(),
        type: 'service',
        title: item.title,
        priceNegotiable: towing,
        priceAmount: towing ? null : BigInt((150 + Math.floor(rnd() * 10) * 50) * 100),
        priceCurrency: towing ? null : pick(['PRB', 'MDL'] as const),
        cityId: pick(cities).id,
        publishedAt: publishedAt(i),
        service: {
          create: { categoryId: found.id, workingHours: item.hours, mobileService: towing },
        },
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
