'use client';

import {
  BODY_TYPES,
  CAR_CONDITIONS,
  COLORS,
  DRIVES,
  FUEL_TYPES,
  REGISTRATIONS,
  STEERINGS,
  TRANSMISSIONS,
  type BodyType,
  type Color,
  type Drive,
  type Transmission,
} from '@clickauto/shared';
import { ChipChoice, ChipMulti, Field, Input, Select, Switch } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { useListBrands, useListModels } from '@/shared/api/generated/catalog/catalog';
import {
  CityField,
  DescriptionField,
  groupDigits,
  PhoneField,
  PriceField,
  useFieldError,
  type Patch,
} from './common-fields';
import { OTHER_MODEL, type FieldErrors, type ListingFormState } from './model';
import { PhotoPicker } from './photo-picker';

interface StepProps {
  form: ListingFormState;
  patch: Patch;
  errors: FieldErrors;
}

type Car = ListingFormState['car'];
const patchCar = (patch: Patch, update: Partial<Car>) =>
  patch((f) => ({ ...f, car: { ...f.car, ...update } }));

/** Step 1 (design 17): photos, brand, model, year, mileage, price, city. */
export function CarMainStep({ form, patch, errors }: StepProps) {
  const t = useTranslations('listingForm');
  const error = useFieldError(errors);
  const brands = useListBrands();
  const models = useListModels(form.car.brandId, { query: { enabled: Boolean(form.car.brandId) } });
  const brandList = brands.data?.status === 200 ? brands.data.data : [];
  const modelList = models.data?.status === 200 ? models.data.data : [];

  return (
    <>
      <PhotoPicker
        photos={form.photos}
        onChange={(update) => patch((f) => ({ ...f, photos: update(f.photos) }))}
        error={error('photoIds')}
      />
      <Select
        label={t('car.brand')}
        placeholder={t('choose')}
        value={form.car.brandId}
        // Changing the brand resets the model (05-filters.md, dependencies).
        onChange={(event) =>
          patchCar(patch, { brandId: event.target.value, modelId: '', customModelName: '' })
        }
        options={brandList.map((brand) => ({ value: brand.id, label: brand.name }))}
        error={form.car.brandId ? undefined : error('car.modelId')}
      />
      <Select
        label={t('car.model')}
        placeholder={t('choose')}
        disabled={!form.car.brandId}
        value={form.car.modelId}
        onChange={(event) => patchCar(patch, { modelId: event.target.value })}
        options={[
          ...modelList.map((model) => ({ value: model.id, label: model.name })),
          { value: OTHER_MODEL, label: t('car.otherModel') },
        ]}
        error={form.car.brandId ? error('car.modelId') : undefined}
      />
      {form.car.modelId === OTHER_MODEL ? (
        <Input
          label={t('car.customModel')}
          maxLength={60}
          value={form.car.customModelName}
          onChange={(event) => patchCar(patch, { customModelName: event.target.value })}
          error={error('car.customModelName')}
        />
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('car.year')}
          inputMode="numeric"
          maxLength={4}
          value={form.car.year}
          onChange={(event) => patchCar(patch, { year: event.target.value.replace(/\D/g, '') })}
          error={error('car.year')}
        />
        <Input
          label={t('car.mileage')}
          inputMode="numeric"
          value={groupDigits(form.car.mileageKm)}
          onChange={(event) =>
            patchCar(patch, { mileageKm: event.target.value.replace(/\D/g, '') })
          }
          error={error('car.mileageKm')}
        />
      </div>
      <PriceField form={form} patch={patch} errors={errors} label={t('price')} />
      <CityField form={form} patch={patch} errors={errors} />
    </>
  );
}

/** Step 2 (design 24): specs. */
export function CarSpecsStep({ form, patch, errors }: StepProps) {
  const t = useTranslations('listingForm');
  const d = useTranslations('dict');
  const error = useFieldError(errors);
  const car = form.car;
  const options = <T extends string>(values: readonly T[], group: string) =>
    values.map((value) => {
      const key: string = `${group}.${value}`;
      return { value, label: d(key) };
    });
  const onlyElectric = car.fuelTypes.length === 1 && car.fuelTypes[0] === 'electric';

  return (
    <>
      <Field label={t('car.condition')} error={error('car.condition')}>
        <ChipChoice
          options={options(CAR_CONDITIONS, 'carCondition')}
          value={car.condition}
          onChange={(condition) => patchCar(patch, { condition })}
        />
      </Field>
      <Select
        label={t('car.bodyType')}
        placeholder={t('notSpecified')}
        value={car.bodyType}
        onChange={(event) => patchCar(patch, { bodyType: event.target.value as BodyType | '' })}
        options={options(BODY_TYPES, 'bodyType')}
      />
      <Select
        label={t('car.transmission')}
        placeholder={t('notSpecified')}
        value={car.transmission}
        onChange={(event) =>
          patchCar(patch, { transmission: event.target.value as Transmission | '' })
        }
        options={options(TRANSMISSIONS, 'transmission')}
      />
      <Select
        label={t('car.drive')}
        placeholder={t('notSpecified')}
        value={car.drive}
        onChange={(event) => patchCar(patch, { drive: event.target.value as Drive | '' })}
        options={options(DRIVES, 'drive')}
      />
      <Field label={t('car.fuel')}>
        <ChipMulti
          options={options(FUEL_TYPES, 'fuel')}
          value={car.fuelTypes}
          onChange={(fuelTypes) => patchCar(patch, { fuelTypes })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {/* Electric cars have no engine volume (05-filters.md). */}
        {onlyElectric ? null : (
          <Input
            label={t('car.engine')}
            inputMode="numeric"
            value={car.engineVolumeCc}
            onChange={(event) =>
              patchCar(patch, { engineVolumeCc: event.target.value.replace(/\D/g, '') })
            }
            error={error('car.engineVolumeCc')}
          />
        )}
        <Input
          label={t('car.power')}
          inputMode="numeric"
          value={car.powerHp}
          onChange={(event) => patchCar(patch, { powerHp: event.target.value.replace(/\D/g, '') })}
          error={error('car.powerHp')}
        />
      </div>
      <Field label={t('car.steering')}>
        <ChipChoice
          options={options(STEERINGS, 'steering')}
          value={car.steering}
          onChange={(steering) => patchCar(patch, { steering })}
          allowEmpty
        />
      </Field>
      <Field label={t('car.registration')}>
        <ChipChoice
          options={options(REGISTRATIONS, 'registration')}
          value={car.registration}
          onChange={(registration) => patchCar(patch, { registration })}
          allowEmpty
        />
      </Field>
      <Select
        label={t('car.color')}
        placeholder={t('notSpecified')}
        value={car.color}
        onChange={(event) => patchCar(patch, { color: event.target.value as Color | '' })}
        options={options(COLORS, 'color')}
      />
      <Input
        label={t('car.owners')}
        inputMode="numeric"
        maxLength={2}
        value={car.ownersCount}
        onChange={(event) =>
          patchCar(patch, { ownersCount: event.target.value.replace(/\D/g, '') })
        }
        error={error('car.ownersCount')}
      />
      <Switch
        label={t('car.exchange')}
        checked={car.exchangePossible}
        onChange={(exchangePossible) => patchCar(patch, { exchangePossible })}
      />
    </>
  );
}

/** Step 3 (design 25): description, VIN, phone. */
export function CarDescriptionStep({ form, patch, errors }: StepProps) {
  const t = useTranslations('listingForm');
  const error = useFieldError(errors);
  return (
    <>
      <DescriptionField form={form} patch={patch} errors={errors} />
      <Input
        label={t('car.vin')}
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={17}
        value={form.car.vin}
        onChange={(event) =>
          patchCar(patch, { vin: event.target.value.toUpperCase().replace(/\s/g, '') })
        }
        hint={t('car.vinHint')}
        error={error('car.vin')}
      />
      <PhoneField form={form} patch={patch} errors={errors} />
    </>
  );
}
