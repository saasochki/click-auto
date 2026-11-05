import { describe, expect, it } from 'vitest';
import { listingHref, listingIdFromSegment, slugify } from './listing-href';

const ID = '01a1a932-2a59-7066-9c40-77c1fbb50d50';

describe('listing URLs', () => {
  it('slugifies latin, Romanian and Cyrillic titles', () => {
    expect(slugify('Toyota Camry, 2018')).toBe('toyota-camry-2018');
    expect(slugify('Ștefan Vodă')).toBe('stefan-voda');
    expect(slugify('Шиномонтаж и балансировка')).toBe('shinomontazh-i-balansirovka');
    expect(slugify('Чёрный йогурт')).toBe('chernyy-yogurt');
  });

  it('builds the card path by type and reads the id back', () => {
    const href = listingHref({ id: ID, type: 'service', title: 'Шиномонтаж' });
    expect(href).toBe(`/services/item/${ID}-shinomontazh`);
    expect(listingIdFromSegment(`${ID}-shinomontazh`)).toBe(ID);
    expect(listingIdFromSegment('not-an-id')).toBeNull();
  });
});
