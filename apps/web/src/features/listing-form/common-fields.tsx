'use client';

import { LISTING_DESCRIPTION_MAX, type Currency } from '@clickauto/shared';
import { Checkbox, Input, Segmented, Select, Textarea } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { useListRegions } from '@/shared/api/generated/catalog/catalog';
import type { FieldErrors, ListingFormState } from './model';

export type Patch = (update: (form: ListingFormState) => ListingFormState) => void;

/** Translates an error code under a field; unknown codes fall back to "invalid". */
export function useFieldError(errors: FieldErrors) {
  const t = useTranslations('listingForm.errors');
  return (field: string): string | undefined => {
    const code = errors[field];
    if (!code) return undefined;
    return t.has(code) ? t(code) : t('invalid');
  };
}

/** Digits only, grouped by thousands while typing: "98000" -> "98 000". */
export function groupDigits(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function PriceField({
  form,
  patch,
  errors,
  label,
}: {
  form: ListingFormState;
  patch: Patch;
  errors: FieldErrors;
  label: string;
}) {
  const t = useTranslations('listingForm');
  const error = useFieldError(errors);
  // Design order: $ USD, € EUR, руб. ПМР, лей.
  const options = (['USD', 'EUR', 'PRB', 'MDL'] as const).map((value) => ({
    value,
    label: t(`currencyOption.${value}`),
  }));
  return (
    <div className="flex flex-col gap-3">
      <Input
        label={label}
        inputMode="decimal"
        value={form.price}
        onChange={(event) =>
          patch((f) => ({ ...f, price: event.target.value.replace(/[^\d\s.,]/g, '') }))
        }
        error={error('price')}
      />
      <Segmented<Currency>
        label={t('currency')}
        options={options}
        value={form.currency}
        onChange={(currency) => patch((f) => ({ ...f, currency }))}
      />
      <Checkbox
        checked={form.priceNegotiable}
        onChange={(priceNegotiable) => patch((f) => ({ ...f, priceNegotiable }))}
        label={t('negotiable')}
      />
    </div>
  );
}

export function CityField({
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
  const regions = useListRegions();
  const list = regions.data?.status === 200 ? regions.data.data : [];
  return (
    <Select
      label={t('city')}
      placeholder={t('choose')}
      value={form.cityId}
      onChange={(event) => patch((f) => ({ ...f, cityId: event.target.value }))}
      groups={list
        .filter((region) => region.cities.length > 0)
        .map((region) => ({
          label: region.name,
          options: region.cities.map((city) => ({ value: city.id, label: city.name })),
        }))}
      error={error('cityId')}
    />
  );
}

export function DescriptionField({
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
  return (
    <Textarea
      label={t('description')}
      value={form.description}
      maxLength={LISTING_DESCRIPTION_MAX}
      onChange={(event) => patch((f) => ({ ...f, description: event.target.value }))}
      error={error('description')}
    />
  );
}

export function PhoneField({
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
  return (
    <Input
      label={t('phone')}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+373"
      value={form.contactPhone}
      onChange={(event) => patch((f) => ({ ...f, contactPhone: event.target.value }))}
      hint={t('phoneHint')}
      error={error('contactPhone')}
    />
  );
}

export function TitleField({
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
  return (
    <Input
      label={t('title')}
      value={form.title}
      maxLength={120}
      onChange={(event) => patch((f) => ({ ...f, title: event.target.value }))}
      error={error('title')}
    />
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <h2 className="pt-2 text-h3">{children}</h2>;
}
