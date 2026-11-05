import { newId } from '@clickauto/db';
import {
  buildListingDocuments,
  createMeiliClient,
  ensureListingsIndex,
  latestUsdRates,
  listingsIndex,
} from '@clickauto/search';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, E2E, ORIGIN, testEmail, type TestApp } from './helpers';

/**
 * Feed search against a real Meilisearch with its own index (MEILI_INDEX=listings_test).
 * The worker's outbox step is reproduced with the same document builder.
 */
describe.skipIf(!E2E)('search', () => {
  const indexName = 'listings_test';
  process.env.MEILI_KEY ??= 'local-dev-master-key';
  const meili = createMeiliClient({
    url: process.env.MEILI_URL ?? 'http://localhost:7700',
    key: process.env.MEILI_KEY,
  });
  let t: TestApp;
  let cookie: string;
  let cityId: string;
  let modelId: string;
  let brandSlug: string;

  const http = () => request(t.app.getHttpServer());
  const post = (url: string) => http().post(url).set('Origin', ORIGIN).set('Cookie', cookie);
  const sync = async (ids: string[]) => {
    const rates = await latestUsdRates(t.prisma);
    const { documents, removeIds } = await buildListingDocuments(t.prisma, ids, rates);
    const index = listingsIndex(meili, indexName);
    if (documents.length) await index.addDocuments(documents).waitTask();
    if (removeIds.length) await index.deleteDocuments(removeIds).waitTask();
  };

  beforeAll(async () => {
    process.env.MEILI_INDEX = indexName;
    t = await createTestApp();
    await ensureListingsIndex(meili, indexName);
    await listingsIndex(meili, indexName).deleteAllDocuments().waitTask();

    const email = testEmail('searcher');
    await http().post('/api/v1/auth/email/start').set('Origin', ORIGIN).send({ email }).expect(204);
    const verify = await http()
      .post('/api/v1/auth/email/verify')
      .set('Origin', ORIGIN)
      .send({ email, code: t.mail.lastCodeFor(email) })
      .expect(200);
    cookie = ((verify.headers['set-cookie'] as unknown as string[])[0] ?? '').split(';')[0] ?? '';
    await post('/api/v1/auth/complete-profile')
      .send({ username: `q${Date.now().toString(36)}`, name: 'Покупатель' })
      .expect(200);

    cityId = (await t.prisma.city.findFirstOrThrow({ where: { slug: 'tiraspol' } })).id;
    brandSlug = `search-brand-${Date.now()}`;
    const brand = await t.prisma.brand.create({
      data: { id: newId(), slug: brandSlug, name: 'Searcha' },
    });
    modelId = (
      await t.prisma.model.create({
        data: { id: newId(), brandId: brand.id, slug: 'two', name: 'Two' },
      })
    ).id;
  });

  afterAll(async () => {
    await t.app.close();
    delete process.env.MEILI_INDEX;
  });

  const publishCar = async (price: { amount: number; currency: string } | null, year: number) => {
    const created = await post('/api/v1/listings')
      .send({
        type: 'car',
        cityId,
        price,
        priceNegotiable: price === null,
        car: { modelId, year, condition: 'used', mileageKm: 50_000, fuelTypes: ['diesel'] },
      })
      .expect(201);
    const id = created.body.id as string;
    await post(`/api/v1/listings/${id}/publish`).expect(200);
    await sync([id]);
    return id;
  };

  it('finds published cars by brand, filters and sorts them, drops hidden ones', async () => {
    const cheap = await publishCar({ amount: 500_000, currency: 'USD' }, 2012);
    const pricey = await publishCar({ amount: 2_000_000, currency: 'USD' }, 2020);
    const negotiable = await publishCar(null, 2016);

    const all = await http()
      .get(`/api/v1/listings?type=car&car=${brandSlug}&facets=model`)
      .expect(200);
    expect(all.body.total).toBe(3);
    expect(all.body.items.find((i: { id: string }) => i.id === negotiable)).toMatchObject({
      id: negotiable,
      title: 'Searcha Two, 2016',
      city: { slug: 'tiraspol', name: 'Тирасполь' },
      car: { brand: { slug: brandSlug }, year: 2016, fuelTypes: ['diesel'] },
    });
    expect(all.body.facets.model).toEqual({ [`${brandSlug}:two`]: 3 });

    const sorted = await http()
      .get(`/api/v1/listings?type=car&car=${brandSlug}&sort=price_desc`)
      .expect(200);
    expect(sorted.body.items.map((i: { id: string }) => i.id)).toEqual([pricey, cheap, negotiable]);

    const ranged = await http()
      .get(`/api/v1/listings/count?type=car&car=${brandSlug}&priceTo=10000&priceCurrency=USD`)
      .expect(200);
    expect(ranged.body.total).toBe(1);
    const withNegotiable = await http()
      .get(`/api/v1/listings/count?type=car&car=${brandSlug}&priceTo=10000&negotiable=true`)
      .expect(200);
    expect(withNegotiable.body.total).toBe(2);

    const paged = await http()
      .get(`/api/v1/listings?type=car&car=${brandSlug}&limit=2`)
      .expect(200);
    expect(paged.body.items).toHaveLength(2);
    const next = await http()
      .get(`/api/v1/listings?type=car&car=${brandSlug}&limit=2&cursor=${paged.body.nextCursor}`)
      .expect(200);
    expect(next.body.items).toHaveLength(1);
    expect(next.body.nextCursor).toBeNull();

    await post(`/api/v1/listings/${cheap}/hide`).expect(200);
    await sync([cheap]);
    const afterHide = await http()
      .get(`/api/v1/listings/count?type=car&car=${brandSlug}`)
      .expect(200);
    expect(afterHide.body.total).toBe(2);
  });

  it('validates the query', async () => {
    await http().get('/api/v1/listings').expect(422);
    await http().get('/api/v1/listings?type=car&cursor=nope').expect(400);
    await http().get('/api/v1/listings?type=car&sort=random').expect(422);
  });
});
