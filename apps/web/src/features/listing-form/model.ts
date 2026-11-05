import {
  hasValidPrice,
  listingInputSchema,
  parseMajorToMinor,
  type BodyType,
  type CarCondition,
  type Color,
  type Currency,
  type Drive,
  type FuelType,
  type GoodsCondition,
  type ListingInput,
  type ListingType,
  type Registration,
  type Steering,
  type Transmission,
} from '@clickauto/shared';
import type { ListingDto } from '@/shared/api/generated/model';
import { minorToInput } from '@/shared/lib/format';

/** Model "Другая": brand from the catalog, model typed by hand. */
export const OTHER_MODEL = 'other';

export interface FormPhoto {
  id: string;
  thumbUrl: string;
}

export type AttributeValue = string | boolean | string[];

/** What the form holds: strings as typed, converted to the API input on save. */
export interface ListingFormState {
  type: ListingType;
  photos: FormPhoto[];
  title: string;
  cityId: string;
  price: string;
  currency: Currency;
  priceNegotiable: boolean;
  description: string;
  contactPhone: string;
  car: {
    brandId: string;
    modelId: string;
    customModelName: string;
    year: string;
    mileageKm: string;
    bodyType: BodyType | '';
    transmission: Transmission | '';
    drive: Drive | '';
    fuelTypes: FuelType[];
    engineVolumeCc: string;
    powerHp: string;
    steering: Steering | null;
    color: Color | '';
    registration: Registration | null;
    condition: CarCondition | null;
    ownersCount: string;
    vin: string;
    exchangePossible: boolean;
  };
  goods: {
    categoryId: string;
    condition: GoodsCondition | null;
    attributes: Record<string, AttributeValue>;
    compatibleModels: { modelId: string; label: string }[];
  };
  service: {
    categoryId: string;
    address: string;
    workingHours: string;
    mobileService: boolean;
    servedBrands: string[];
  };
}

export function emptyForm(type: ListingType): ListingFormState {
  return {
    type,
    photos: [],
    title: '',
    cityId: '',
    price: '',
    currency: 'USD',
    priceNegotiable: false,
    description: '',
    contactPhone: '',
    car: {
      brandId: '',
      modelId: '',
      customModelName: '',
      year: '',
      mileageKm: '',
      bodyType: '',
      transmission: '',
      drive: '',
      fuelTypes: [],
      engineVolumeCc: '',
      powerHp: '',
      steering: 'left',
      color: '',
      registration: null,
      condition: null,
      ownersCount: '',
      vin: '',
      exchangePossible: false,
    },
    goods: { categoryId: '', condition: null, attributes: {}, compatibleModels: [] },
    service: {
      categoryId: '',
      address: '',
      workingHours: '',
      mobileService: false,
      servedBrands: [],
    },
  };
}

const text = (value: string | null | undefined) => value ?? '';
const num = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value);

/** Existing listing -> form, for editing. */
export function formFromListing(listing: ListingDto): ListingFormState {
  const form = emptyForm(listing.type);
  form.photos = listing.photos.map((photo) => ({ id: photo.id, thumbUrl: photo.thumbUrl }));
  form.title = listing.type === 'car' ? '' : listing.title;
  form.cityId = listing.city.id;
  if (listing.price) {
    form.price = minorToInput(listing.price.amount, listing.price.currency);
    form.currency = listing.price.currency;
  }
  form.priceNegotiable = listing.priceNegotiable;
  form.description = listing.description;
  form.contactPhone = text(listing.contactPhone);
  const car = listing.car;
  if (car) {
    form.car = {
      brandId: text(car.brand?.id),
      modelId: car.model ? car.model.id : car.customModelName ? OTHER_MODEL : '',
      customModelName: text(car.customModelName),
      year: num(car.year),
      mileageKm: num(car.mileageKm),
      bodyType: car.bodyType ?? '',
      transmission: car.transmission ?? '',
      drive: car.drive ?? '',
      fuelTypes: car.fuelTypes,
      engineVolumeCc: num(car.engineVolumeCc),
      powerHp: num(car.powerHp),
      steering: car.steering,
      color: car.color ?? '',
      registration: car.registration,
      condition: car.condition,
      ownersCount: num(car.ownersCount),
      vin: text(car.vin),
      exchangePossible: car.exchangePossible,
    };
  }
  const goods = listing.goods;
  if (goods) {
    const attributes: Record<string, AttributeValue> = {};
    for (const [key, value] of Object.entries(goods.attributes)) {
      if (typeof value === 'number') attributes[key] = String(value);
      else if (typeof value === 'string' || typeof value === 'boolean') attributes[key] = value;
      else if (Array.isArray(value)) attributes[key] = value.map(String);
    }
    form.goods = {
      categoryId: goods.category.id,
      condition: goods.condition,
      attributes,
      compatibleModels: goods.compatibleModels.map((m) => ({ modelId: m.modelId, label: '' })),
    };
  }
  const service = listing.service;
  if (service) {
    form.service = {
      categoryId: service.category.id,
      address: text(service.address),
      workingHours: text(service.workingHours),
      mobileService: service.mobileService,
      servedBrands: service.servedBrands,
    };
  }
  return form;
}

/** "98 000" -> 98000, "" -> null, garbage -> NaN (schema reports it). */
function toInt(value: string): number | null {
  const clean = value.replace(/\s/g, '');
  if (!clean) return null;
  return /^\d+$/.test(clean) ? Number(clean) : Number.NaN;
}

const orNull = (value: string) => (value.trim() ? value.trim() : null);

export interface AttributeDef {
  key: string;
  type: string;
}

/** Form -> raw API input (before the shared schema fills defaults and checks it). */
export function toRawInput(
  form: ListingFormState,
  attributeDefs: readonly AttributeDef[],
): unknown {
  // An unparsable amount becomes NaN so the shared schema reports the price field.
  // "Договорная" with an amount keeps the amount: the author still named a price.
  const priceText = form.price.trim();
  const price = priceText
    ? { amount: parseMajorToMinor(priceText, form.currency) ?? Number.NaN, currency: form.currency }
    : null;
  const common = {
    type: form.type,
    cityId: form.cityId,
    description: form.description,
    price,
    priceNegotiable: form.priceNegotiable,
    contactPhone: orNull(form.contactPhone.replace(/[\s()-]/g, '')),
    photoIds: form.photos.map((photo) => photo.id),
  };

  if (form.type === 'car') {
    const car = form.car;
    const other = car.modelId === OTHER_MODEL;
    return {
      ...common,
      car: {
        modelId: other ? null : orNull(car.modelId),
        brandId: other ? orNull(car.brandId) : null,
        customModelName: other ? orNull(car.customModelName) : null,
        year: toInt(car.year) ?? undefined,
        mileageKm: toInt(car.mileageKm),
        bodyType: car.bodyType || null,
        transmission: car.transmission || null,
        drive: car.drive || null,
        fuelTypes: car.fuelTypes,
        // Electric cars have no engine volume: the field is hidden and its old value dropped.
        engineVolumeCc:
          car.fuelTypes.length === 1 && car.fuelTypes[0] === 'electric'
            ? null
            : toInt(car.engineVolumeCc),
        powerHp: toInt(car.powerHp),
        steering: car.steering,
        color: car.color || null,
        registration: car.registration,
        condition: car.condition ?? undefined,
        ownersCount: toInt(car.ownersCount),
        vin: orNull(car.vin),
        exchangePossible: car.exchangePossible,
      },
    };
  }

  if (form.type === 'goods') {
    const attributes: Record<string, unknown> = {};
    for (const def of attributeDefs) {
      const value = form.goods.attributes[def.key];
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0))
        continue;
      if (def.type === 'number' || def.type === 'range') {
        attributes[def.key] =
          typeof value === 'string' ? Number(value.replace(',', '.').replace(/\s/g, '')) : value;
      } else {
        attributes[def.key] = value;
      }
    }
    return {
      ...common,
      title: form.title,
      goods: {
        categoryId: form.goods.categoryId,
        condition: form.goods.condition ?? undefined,
        attributes,
        compatibleModels: form.goods.compatibleModels.map((m) => ({ modelId: m.modelId })),
      },
    };
  }

  return {
    ...common,
    title: form.title,
    service: {
      categoryId: form.service.categoryId,
      address: orNull(form.service.address),
      workingHours: orNull(form.service.workingHours),
      mobileService: form.service.mobileService,
      servedBrands: form.service.servedBrands,
    },
  };
}

export type FieldErrors = Record<string, string>;

/** zod issue -> error code shown under the field (keys of `listingForm.errors`). */
function issueCode(
  field: string,
  issue: { code: string; message: string; received?: unknown },
): string {
  if (issue.message === 'model_required' || issue.message === 'vin_format') return issue.message;
  if (
    issue.code === 'invalid_type' &&
    (issue.received === 'undefined' || issue.received === 'null')
  )
    return 'required';
  if (field === 'contactPhone') return 'phone';
  if (field === 'cityId' || field.endsWith('categoryId')) return 'required';
  if (issue.code === 'too_small') return 'too_short';
  if (issue.code === 'too_big') return 'too_long';
  return 'invalid';
}

export function validate(
  form: ListingFormState,
  attributeDefs: readonly AttributeDef[],
  publishing: boolean,
): { input: ListingInput | null; errors: FieldErrors } {
  const result = listingInputSchema.safeParse(toRawInput(form, attributeDefs));
  const errors: FieldErrors = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      const field = path.startsWith('price') ? 'price' : path;
      errors[field] ??= issueCode(
        field,
        issue as { code: string; message: string; received?: unknown },
      );
    }
  }
  if (form.type === 'car' && form.car.modelId === OTHER_MODEL && !form.car.customModelName.trim()) {
    errors['car.customModelName'] = 'required';
  }
  if (form.type === 'goods') {
    for (const def of attributeDefs as readonly (AttributeDef & { required?: boolean })[]) {
      const value = form.goods.attributes[def.key];
      const empty =
        value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
      if (def.required && empty) errors[`goods.attributes.${def.key}`] = 'required';
    }
  }
  if (publishing && result.success && !hasValidPrice(result.data)) errors.price = 'price_required';
  if (Object.keys(errors).length > 0 || !result.success) return { input: null, errors };
  return { input: result.data, errors };
}

/** Which step of the car form shows a field: used to jump to the first error. */
export function carStepOf(field: string): number {
  if (field === 'description' || field === 'contactPhone' || field === 'car.vin') return 2;
  if (
    field.startsWith('car.') &&
    !['car.modelId', 'car.brandId', 'car.customModelName', 'car.year', 'car.mileageKm'].includes(
      field,
    )
  ) {
    return 1;
  }
  return 0;
}
