import { describe, expect, it } from 'vitest';
import { carStepOf, emptyForm, OTHER_MODEL, validate, type ListingFormState } from './model';

const CITY = '01a1a21c-d78a-7528-90a7-d5e180c36638';
const MODEL = '01a1a21c-dbe7-755e-a75b-3be9a9e363d8';
const BRAND = '01a1a21c-dc03-71ef-a248-f02923f0a324';

function car(
  update: Partial<ListingFormState['car']> = {},
  common: Partial<ListingFormState> = {},
) {
  const form = emptyForm('car');
  return {
    ...form,
    cityId: CITY,
    price: '15 900',
    ...common,
    car: { ...form.car, modelId: MODEL, year: '2018', condition: 'used' as const, ...update },
  };
}

describe('listing form model', () => {
  it('converts typed strings into the API input', () => {
    const { input, errors } = validate(
      car({ mileageKm: '98000', vin: 'jtnb11hk0j3000000' }),
      [],
      true,
    );
    expect(errors).toEqual({});
    expect(input).toMatchObject({
      type: 'car',
      price: { amount: 1_590_000, currency: 'USD' },
      car: { modelId: MODEL, year: 2018, mileageKm: 98_000, vin: 'JTNB11HK0J3000000' },
    });
  });

  it('requires a price or "Договорная" only when publishing', () => {
    expect(validate(car({}, { price: '' }), [], false).errors).toEqual({});
    expect(validate(car({}, { price: '' }), [], true).errors).toEqual({ price: 'price_required' });
    expect(validate(car({}, { price: '', priceNegotiable: true }), [], true).errors).toEqual({});
  });

  it('reports field codes and the step that shows them', () => {
    const { errors } = validate(
      car({ year: '', condition: null, vin: 'BAD' }, { contactPhone: '777' }),
      [],
      false,
    );
    expect(errors).toMatchObject({
      'car.year': 'required',
      'car.condition': 'required',
      'car.vin': 'vin_format',
      contactPhone: 'phone',
    });
    expect(carStepOf('car.year')).toBe(0);
    expect(carStepOf('car.condition')).toBe(1);
    expect(carStepOf('car.vin')).toBe(2);
  });

  it('sends brand and model text for model "Другая"', () => {
    const missing = validate(car({ modelId: OTHER_MODEL, brandId: BRAND }), [], false);
    expect(missing.errors['car.customModelName']).toBe('required');
    const ok = validate(
      car({ modelId: OTHER_MODEL, brandId: BRAND, customModelName: 'Amarok' }),
      [],
      false,
    );
    expect(ok.input).toMatchObject({
      car: { modelId: null, brandId: BRAND, customModelName: 'Amarok' },
    });
  });

  it('drops engine volume for electric cars', () => {
    const { input } = validate(car({ fuelTypes: ['electric'], engineVolumeCc: '2000' }), [], false);
    expect(input).toMatchObject({ car: { engineVolumeCc: null } });
  });

  it('checks required goods attributes and converts numbers', () => {
    const form = emptyForm('goods');
    const goods: ListingFormState = {
      ...form,
      title: 'Michelin Primacy 4',
      cityId: CITY,
      priceNegotiable: true,
      goods: {
        ...form.goods,
        categoryId: CITY,
        condition: 'used' as const,
        attributes: { width: '205' },
      },
    };
    const defs = [
      { key: 'width', type: 'number', required: true },
      { key: 'season', type: 'enum', required: true },
    ];
    expect(validate(goods, defs, true).errors).toEqual({ 'goods.attributes.season': 'required' });
    goods.goods.attributes = { width: '205', season: 'summer' };
    expect(validate(goods, defs, true).input).toMatchObject({
      goods: { attributes: { width: 205, season: 'summer' } },
    });
  });
});
