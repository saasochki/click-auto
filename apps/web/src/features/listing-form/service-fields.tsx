'use client';

import { ChipMulti, Field, Input, Select, Switch } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { useListBrands } from '@/shared/api/generated/catalog/catalog';
import {
  CityField,
  DescriptionField,
  PhoneField,
  PriceField,
  TitleField,
  useFieldError,
  type Patch,
} from './common-fields';
import type { FieldErrors, ListingFormState } from './model';
import { PhotoPicker } from './photo-picker';
import { useCategoryOptions } from './use-categories';

/** Service form (design 32). */
export function ServiceFields({
  form,
  patch,
  errors,
}: {
  form: ListingFormState;
  patch: Patch;
  errors: FieldErrors;
}) {
  const t = useTranslations('listingForm');
  const error = useFieldError(errors);
  const { options } = useCategoryOptions('service');
  const brands = useListBrands();
  const brandList = brands.data?.status === 200 ? brands.data.data : [];
  const setService = (update: Partial<ListingFormState['service']>) =>
    patch((f) => ({ ...f, service: { ...f.service, ...update } }));

  return (
    <>
      <PhotoPicker
        photos={form.photos}
        onChange={(update) => patch((f) => ({ ...f, photos: update(f.photos) }))}
        error={error('photoIds')}
      />
      <Select
        label={t('category')}
        placeholder={t('choose')}
        value={form.service.categoryId}
        onChange={(event) => setService({ categoryId: event.target.value })}
        options={options.map((option) => ({ value: option.category.id, label: option.label }))}
        error={error('service.categoryId')}
      />
      <TitleField form={form} patch={patch} errors={errors} />
      <PriceField form={form} patch={patch} errors={errors} label={t('priceFrom')} />
      <CityField form={form} patch={patch} errors={errors} />
      <Input
        label={t('service.address')}
        maxLength={200}
        value={form.service.address}
        onChange={(event) => setService({ address: event.target.value })}
        error={error('service.address')}
      />
      <Input
        label={t('service.workingHours')}
        maxLength={200}
        placeholder={t('service.workingHoursPlaceholder')}
        value={form.service.workingHours}
        onChange={(event) => setService({ workingHours: event.target.value })}
        error={error('service.workingHours')}
      />
      <Switch
        label={t('service.mobile')}
        checked={form.service.mobileService}
        onChange={(mobileService) => setService({ mobileService })}
      />
      <Field label={t('service.brands')} hint={t('service.brandsHint')}>
        <div className="max-h-60 overflow-y-auto rounded-md border border-border p-2">
          <ChipMulti
            options={brandList.map((brand) => ({ value: brand.id, label: brand.name }))}
            value={form.service.servedBrands}
            onChange={(servedBrands) => setService({ servedBrands })}
          />
        </div>
      </Field>
      <DescriptionField form={form} patch={patch} errors={errors} />
      <PhoneField form={form} patch={patch} errors={errors} />
    </>
  );
}
