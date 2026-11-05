'use client';

import { GOODS_CONDITIONS } from '@clickauto/shared';
import { ChipChoice, ChipMulti, Field, Input, Select, Switch } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import type { CategoryDtoAttributesItem } from '@/shared/api/generated/model';
import {
  CityField,
  DescriptionField,
  PhoneField,
  PriceField,
  SectionTitle,
  TitleField,
  useFieldError,
  type Patch,
} from './common-fields';
import type { AttributeValue, FieldErrors, ListingFormState } from './model';
import { PhotoPicker } from './photo-picker';
import { useCategoryOptions } from './use-categories';

interface Props {
  form: ListingFormState;
  patch: Patch;
  errors: FieldErrors;
}

/** Field of one category attribute: number, choice, several choices, yes/no or text. */
function AttributeField({
  def,
  value,
  onChange,
  error,
}: {
  def: CategoryDtoAttributesItem;
  value: AttributeValue | undefined;
  onChange: (value: AttributeValue) => void;
  error?: string;
}) {
  const d = useTranslations('dict');
  const label = d.has(`attr.${def.key}`) ? d(`attr.${def.key}`) : def.key;
  const unit = def.unit && d.has(`unit.${def.unit}`) ? d(`unit.${def.unit}`) : def.unit;
  const fullLabel = unit ? `${label}, ${unit}` : label;
  const optionLabel = (option: string) =>
    d.has(`attrOption.${def.key}.${option}`) ? d(`attrOption.${def.key}.${option}`) : option;
  const options = (def.options ?? []).map((option) => ({
    value: option,
    label: optionLabel(option),
  }));

  switch (def.type) {
    case 'bool':
      return <Switch label={label} checked={value === true} onChange={onChange} />;
    case 'enum':
      return (
        <Field label={fullLabel} error={error}>
          <ChipChoice
            options={options}
            value={typeof value === 'string' && value ? value : null}
            onChange={(next) => onChange(next ?? '')}
            allowEmpty={!def.required}
          />
        </Field>
      );
    case 'multi_enum':
      return (
        <Field label={fullLabel} error={error}>
          <ChipMulti
            options={options}
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
          />
        </Field>
      );
    case 'number':
    case 'range':
      return (
        <Input
          label={fullLabel}
          inputMode="decimal"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value.replace(/[^\d.,]/g, ''))}
          error={error}
        />
      );
    default:
      return (
        <Input
          label={fullLabel}
          maxLength={200}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          error={error}
        />
      );
  }
}

/** Goods form (design 30–31): category decides the extra fields. */
export function GoodsFields({ form, patch, errors }: Props) {
  const t = useTranslations('listingForm');
  const d = useTranslations('dict');
  const error = useFieldError(errors);
  const { options, byId } = useCategoryOptions('goods');
  const category = byId.get(form.goods.categoryId);
  const attributes = category?.attributes ?? [];
  const setGoods = (update: Partial<ListingFormState['goods']>) =>
    patch((f) => ({ ...f, goods: { ...f.goods, ...update } }));
  const quantity = Number(form.goods.attributes.quantity);
  // Price covers everything in the listing: a set of tires or disks is priced as a set (05-filters.md).
  const priceLabel = quantity > 1 ? t('priceForSet') : t('price');

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
        value={form.goods.categoryId}
        // Changing the category resets its attributes.
        onChange={(event) => setGoods({ categoryId: event.target.value, attributes: {} })}
        options={options.map((option) => ({ value: option.category.id, label: option.label }))}
        error={error('goods.categoryId')}
      />
      <TitleField form={form} patch={patch} errors={errors} />
      <Field label={t('condition')} error={error('goods.condition')}>
        <ChipChoice
          options={GOODS_CONDITIONS.map((value) => ({
            value,
            label: d(`goodsCondition.${value}`),
          }))}
          value={form.goods.condition}
          onChange={(condition) => setGoods({ condition })}
        />
      </Field>
      {attributes.length > 0 ? (
        <>
          <SectionTitle>{t('parameters')}</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {attributes.map((def) => (
              <div
                key={def.key}
                className={
                  def.type === 'number' || def.type === 'range' || def.type === 'text'
                    ? ''
                    : 'col-span-2'
                }
              >
                <AttributeField
                  def={def}
                  value={form.goods.attributes[def.key]}
                  onChange={(value) =>
                    setGoods({ attributes: { ...form.goods.attributes, [def.key]: value } })
                  }
                  error={error(`goods.attributes.${def.key}`)}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
      <PriceField form={form} patch={patch} errors={errors} label={priceLabel} />
      <CityField form={form} patch={patch} errors={errors} />
      <DescriptionField form={form} patch={patch} errors={errors} />
      <PhoneField form={form} patch={patch} errors={errors} />
    </>
  );
}
