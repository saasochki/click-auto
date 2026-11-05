import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, E2E, type TestApp } from './helpers';

interface Field {
  key: string;
  kind: string;
  options?: { value: string; label?: string; parent?: string }[];
}

describe.skipIf(!E2E)('catalog filters', () => {
  let t: TestApp;
  const get = (query: string, locale = 'ru') =>
    request(t.app.getHttpServer())
      .get(`/api/v1/catalog/filters?${query}`)
      .set('Accept-Language', locale);
  const keys = (body: { fields: Field[] }) => body.fields.map((f) => f.key);

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('returns the car panel', async () => {
    const res = await get('type=car').expect(200);
    expect(res.body.type).toBe('car');
    expect(keys(res.body)).toContain('car');
    expect(keys(res.body)).toContain('engine');
  });

  it('adds tyre attributes for a tyre subcategory', async () => {
    const res = await get('type=goods&category=tires-winter').expect(200);
    const list = keys(res.body);
    expect(list).toEqual(
      expect.arrayContaining(['attr.width', 'attr.season', 'attr.studded', 'attr.diameter']),
    );
    expect(list).not.toContain('attr.quantity');
    expect(list).not.toContain('compatibility');
  });

  it('adds compatibility for parts and names categories in the request language', async () => {
    const res = await get('type=goods&category=brakes', 'ro').expect(200);
    expect(keys(res.body)).toEqual(expect.arrayContaining(['attr.part_type', 'compatibility']));
    const category = (res.body.fields as Field[]).find((f) => f.key === 'category');
    expect(category?.options).toContainEqual({ value: 'brakes', label: 'Frâne', parent: 'parts' });
  });

  it('ignores an unknown category', async () => {
    const res = await get('type=goods&category=nothing-here').expect(200);
    expect(keys(res.body)).toEqual(['category', 'condition', 'price', 'posted']);
  });

  it('rejects a bad type', async () => {
    await get('type=boats').expect(422);
  });
});
