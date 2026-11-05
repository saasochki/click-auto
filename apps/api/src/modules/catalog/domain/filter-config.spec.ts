import { describe, expect, it } from 'vitest';
import {
  attributeField,
  CAR_FIELDS,
  goodsFields,
  serviceFields,
  type CategoryOption,
} from './filter-config';

const categories: CategoryOption[] = [
  { slug: 'parts', name: 'Запчасти', parentSlug: null },
  { slug: 'brakes', name: 'Тормоза', parentSlug: 'parts' },
  { slug: 'oils', name: 'Масла', parentSlug: null },
];

const keys = (fields: { key: string }[]) => fields.map((f) => f.key);

describe('filter config', () => {
  it('lists car fields in panel order, advanced ones after the main ones', () => {
    expect(keys(CAR_FIELDS)).toEqual([
      'condition',
      'car',
      'price',
      'year',
      'mileage',
      'fuel',
      'transmission',
      'bodyType',
      'drive',
      'engine',
      'power',
      'steering',
      'color',
      'registration',
      'exchange',
      'posted',
    ]);
    const firstAdvanced = CAR_FIELDS.findIndex((f) => f.advanced);
    expect(CAR_FIELDS.slice(firstAdvanced).every((f) => f.advanced)).toBe(true);
  });

  it('hides engine volume for electric cars and shows years without grouping', () => {
    const engine = CAR_FIELDS.find((f) => f.key === 'engine');
    expect(engine?.hiddenWhen).toEqual({ param: 'fuel', only: ['electric'] });
    expect(CAR_FIELDS.find((f) => f.key === 'year')).toMatchObject({
      params: ['yearFrom', 'yearTo'],
      grouping: false,
    });
  });

  it('shows only common goods filters until a category is chosen', () => {
    expect(keys(goodsFields(categories, null))).toEqual([
      'category',
      'condition',
      'price',
      'posted',
    ]);
  });

  it('adds category attributes and parts compatibility', () => {
    const fields = goodsFields(categories, {
      root: 'parts',
      attributes: [
        { key: 'oem', type: 'text', options: null, unit: null, filterable: true },
        {
          key: 'part_type',
          type: 'enum',
          options: ['original', 'analog'],
          unit: null,
          filterable: true,
        },
      ],
    });
    expect(keys(fields)).toEqual([
      'category',
      'condition',
      'attr.part_type',
      'compatibility',
      'price',
      'posted',
    ]);
    expect(fields[0]?.resets).toEqual(['attr.*', 'compatModel', 'compatYear']);
    expect(fields[0]?.options).toContainEqual({
      value: 'brakes',
      label: 'Тормоза',
      parent: 'parts',
    });
  });

  it('maps attribute types to field kinds', () => {
    const base = { options: null, unit: null, filterable: true };
    expect(
      attributeField({ ...base, key: 'season', type: 'enum', options: ['winter'] }),
    ).toMatchObject({
      kind: 'chip_multi',
      params: ['attr.season'],
      dictionary: 'attrOption.season',
    });
    expect(attributeField({ ...base, key: 'studded', type: 'bool' })?.kind).toBe('checkbox');
    expect(attributeField({ ...base, key: 'width', type: 'number', unit: 'mm' })).toMatchObject({
      kind: 'text',
      unit: 'mm',
    });
    expect(attributeField({ ...base, key: 'quantity', type: 'number' })).toBeNull();
    expect(attributeField({ ...base, key: 'pcd', type: 'text', filterable: false })).toBeNull();
  });

  it('gives services the brands they work with', () => {
    const fields = serviceFields(categories, [{ slug: 'toyota', name: 'Toyota' }]);
    expect(keys(fields)).toEqual(['category', 'servedBrand', 'mobile', 'price', 'posted']);
    expect(fields[1]?.options).toEqual([{ value: 'toyota', label: 'Toyota' }]);
  });
});
