import { newId } from '@clickauto/db';
import sharp from 'sharp';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, E2E, ORIGIN, testEmail, type TestApp } from './helpers';

describe.skipIf(!E2E)('listings', () => {
  let t: TestApp;
  let cookie: string;
  let cityId: string;
  let modelId: string;
  let tiresSummerId: string;

  const http = () => request(t.app.getHttpServer());
  const post = (url: string) => http().post(url).set('Origin', ORIGIN).set('Cookie', cookie);

  beforeAll(async () => {
    t = await createTestApp();
    await t.redis.flushdb();
    const email = testEmail('seller');
    await http().post('/api/v1/auth/email/start').set('Origin', ORIGIN).send({ email }).expect(204);
    const verify = await http()
      .post('/api/v1/auth/email/verify')
      .set('Origin', ORIGIN)
      .send({ email, code: t.mail.lastCodeFor(email) })
      .expect(200);
    cookie = ((verify.headers['set-cookie'] as unknown as string[])[0] ?? '').split(';')[0] ?? '';
    await post('/api/v1/auth/complete-profile')
      .send({ username: `s${Date.now().toString(36)}`, name: 'Продавец' })
      .expect(200);

    cityId = (await t.prisma.city.findFirstOrThrow({ where: { slug: 'tiraspol' } })).id;
    tiresSummerId = (await t.prisma.category.findFirstOrThrow({ where: { slug: 'tires-summer' } }))
      .id;
    const brandSlug = `test-brand-${Date.now()}`;
    const brand = await t.prisma.brand.create({
      data: { id: newId(), slug: brandSlug, name: 'Testa' },
    });
    modelId = (
      await t.prisma.model.create({
        data: { id: newId(), brandId: brand.id, slug: 'one', name: 'One' },
      })
    ).id;
  });

  afterAll(async () => {
    await t.app.close();
  });

  const carBody = (overrides: Record<string, unknown> = {}) => ({
    type: 'car',
    cityId,
    price: { amount: 1_590_000, currency: 'USD' },
    car: { modelId, year: 2018, condition: 'used', mileageKm: 98_000, fuelTypes: ['petrol'] },
    ...overrides,
  });

  it('creates a draft, publishes it, shows the public card, hides it with 410', async () => {
    const created = await post('/api/v1/listings').send(carBody()).expect(201);
    expect(created.body).toMatchObject({
      status: 'draft',
      title: 'Testa One, 2018',
      price: { amount: 1_590_000, currency: 'USD' },
      city: { name: 'Тирасполь' },
      car: { model: { name: 'One' }, brand: { name: 'Testa' } },
    });
    const id = created.body.id as string;

    await http().get(`/api/v1/listings/${id}`).expect(404);
    const published = await post(`/api/v1/listings/${id}/publish`).expect(200);
    expect(published.body.status).toBe('active');
    expect(published.body.publishedAt).not.toBeNull();

    const ro = await http().get(`/api/v1/listings/${id}`).set('Accept-Language', 'ro').expect(200);
    expect(ro.body.city.name).toBe('Tiraspol');

    await post(`/api/v1/listings/${id}/hide`).expect(200);
    const gone = await http().get(`/api/v1/listings/${id}`).expect(410);
    expect(gone.body.code).toBe('listing_gone');
    await post(`/api/v1/listings/${id}/hide`).expect(409);

    const events = await t.prisma.outboxEvent.findMany({
      where: { payload: { equals: { listingId: id } } },
    });
    expect(events.map((e) => e.type)).toEqual(['listing.published', 'listing.unpublished']);
  });

  it('requires a price to publish unless negotiable', async () => {
    const draft = await post('/api/v1/listings')
      .send(carBody({ price: null }))
      .expect(201);
    const res = await post(`/api/v1/listings/${draft.body.id}/publish`).expect(422);
    expect(res.body.errors).toEqual([{ field: 'price', code: 'required' }]);

    const negotiable = await post('/api/v1/listings')
      .send(carBody({ price: null, priceNegotiable: true }))
      .expect(201);
    await post(`/api/v1/listings/${negotiable.body.id}/publish`).expect(200);
  });

  it('rejects stale versions with 409', async () => {
    const draft = await post('/api/v1/listings').send(carBody()).expect(201);
    const id = draft.body.id as string;
    await http()
      .patch(`/api/v1/listings/${id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('If-Match', '1')
      .send(carBody({ description: 'Обновлено' }))
      .expect(200);
    const stale = await http()
      .patch(`/api/v1/listings/${id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('If-Match', '1')
      .send(carBody())
      .expect(409);
    expect(stale.body.code).toBe('version_conflict');
  });

  it('validates goods attributes by category', async () => {
    const base = { type: 'goods', title: 'Michelin Primacy 4', cityId, priceNegotiable: true };
    const bad = await post('/api/v1/listings')
      .send({
        ...base,
        goods: { categoryId: tiresSummerId, condition: 'used', attributes: { width: 205 } },
      })
      .expect(422);
    expect(bad.body.errors).toContainEqual({ field: 'goods.attributes.season', code: 'required' });

    const ok = await post('/api/v1/listings')
      .send({
        ...base,
        goods: {
          categoryId: tiresSummerId,
          condition: 'used',
          attributes: { width: 205, profile: 55, diameter: 16, season: 'summer', quantity: 4 },
        },
      })
      .expect(201);
    expect(ok.body.goods.category.name).toBe('Летние');
  });

  it('uploads a photo, strips metadata and attaches it', async () => {
    const jpeg = await sharp({
      create: { width: 64, height: 48, channels: 3, background: '#cc2222' },
    })
      .withMetadata({ exif: { IFD0: { Copyright: 'test' } } })
      .jpeg()
      .toBuffer();
    const ticket = await post('/api/v1/media/uploads')
      .send({ mimeType: 'image/jpeg', sizeBytes: jpeg.length })
      .expect(201);
    const put = await fetch(ticket.body.uploadUrl as string, {
      method: 'PUT',
      headers: { 'content-type': 'image/jpeg' },
      body: jpeg,
    });
    expect(put.ok).toBe(true);
    const photo = await post(`/api/v1/media/${ticket.body.mediaId}/complete`).expect(200);
    expect(photo.body).toMatchObject({ width: 64, height: 48 });

    const listing = await post('/api/v1/listings')
      .send(carBody({ photoIds: [ticket.body.mediaId] }))
      .expect(201);
    expect(listing.body.photos).toHaveLength(1);
    expect(listing.body.photos[0].thumbUrl).toContain('/rs:fill:480:360');

    const foreign = await post('/api/v1/listings')
      .send(carBody({ photoIds: [newId()] }))
      .expect(422);
    expect(foreign.body.errors).toEqual([{ field: 'photoIds', code: 'unknown' }]);
  });

  it('lists own listings with counts', async () => {
    const counts = await http().get('/api/v1/me/listings/counts').set('Cookie', cookie).expect(200);
    expect(counts.body.draft).toBeGreaterThan(0);
    const page = await http().get('/api/v1/me/listings?limit=2').set('Cookie', cookie).expect(200);
    expect(page.body.items).toHaveLength(2);
    expect(page.body.items[0].contactPhone).toBeNull();
    expect(page.body.nextCursor).not.toBeNull();
  });
});
