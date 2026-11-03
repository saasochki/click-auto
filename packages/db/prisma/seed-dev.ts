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
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
