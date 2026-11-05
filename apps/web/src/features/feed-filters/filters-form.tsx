'use client';

import {
  BODY_TYPES,
  COLORS,
  CURRENCIES,
  DRIVES,
  FUEL_TYPES,
  REGISTRATIONS,
  STEERINGS,
  TRANSMISSIONS,
  type Currency,
  type ListingType,
} from '@clickauto/shared';
import { Checkbox, Chip, ChipMulti, Segmented, Select, Switch } from '@clickauto/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';
import { POSTED_OPTIONS, type FeedFilters } from '@/entities/feed/filters';
import {
  useListBrands,
  useListCategories,
  useListModels,
} from '@/shared/api/generated/catalog/catalog';
import type { CategoryDto, SearchListingsParams } from '@/shared/api/generated/model';
import { CarPairs } from './car-pairs';
import { NumberBox, RangeField } from './range-field';

type Change = (patch: Partial<FeedFilters>) => void;

const CURRENCY_LABEL: Record<Currency, 'usd' | 'eur' | 'prb' | 'mdl'> = {
  USD: 'usd',
  EUR: 'eur',
  PRB: 'prb',
  MDL: 'mdl',
};

function Group({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-label">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Single value of a multi-value parameter, as a select: "Коробка: Любая". */
function OneOf<T extends string>({
  label,
  value,
  values,
  labelOf,
  onChange,
}: {
  label: string;
  value: T[];
  values: readonly T[];
  labelOf: (value: T) => string;
  onChange: (value: T[]) => void;
}) {
  const t = useTranslations('filters');
  return (
    <Select
      label={label}
      placeholder={t('any')}
      value={value.length === 1 ? value[0] : ''}
      options={values.map((v) => ({ value: v, label: labelOf(v) }))}
      onChange={(event) => onChange(event.target.value ? [event.target.value as T] : [])}
    />
  );
}

function PriceFields({ value, onChange }: { value: FeedFilters; onChange: Change }) {
  const t = useTranslations('filters');
  const locale = useLocale();
  return (
    <RangeField
      label={t('price')}
      from={value.priceFrom}
      to={value.priceTo}
      locale={locale}
      onChange={(priceFrom, priceTo) => onChange({ priceFrom, priceTo })}
    >
      <Segmented
        label={t('currency')}
        options={CURRENCIES.map((c) => ({ value: c, label: t(`currencies.${CURRENCY_LABEL[c]}`) }))}
        value={value.priceCurrency ?? 'USD'}
        onChange={(priceCurrency) => onChange({ priceCurrency })}
      />
      <Checkbox
        checked={value.negotiable ?? false}
        onChange={(negotiable) => onChange({ negotiable: negotiable || null })}
        label={t('showNegotiable')}
      />
    </RangeField>
  );
}

function PostedField({ value, onChange }: { value: FeedFilters; onChange: Change }) {
  const t = useTranslations('filters');
  return (
    <Group title={t('posted')}>
      <div className="flex flex-wrap gap-2">
        <Chip selected={value.posted === null} onClick={() => onChange({ posted: null })}>
          {t('postedAny')}
        </Chip>
        {POSTED_OPTIONS.map((days) => (
          <Chip
            key={days}
            selected={value.posted === days}
            onClick={() => onChange({ posted: days })}
          >
            {t('postedDays', { days })}
          </Chip>
        ))}
      </div>
    </Group>
  );
}

function CarFilters({
  value,
  onChange,
  placeParams,
}: {
  value: FeedFilters;
  onChange: Change;
  placeParams: Partial<SearchListingsParams>;
}) {
  const t = useTranslations('filters');
  const d = useTranslations('dict');
  const locale = useLocale();
  const [more, setMore] = useState(false);
  const onlyElectric = value.fuel.length === 1 && value.fuel[0] === 'electric';
  const condition = value.condition.length === 1 ? value.condition[0] : null;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <Chip selected={!condition} onClick={() => onChange({ condition: [] })}>
          {t('all')}
        </Chip>
        {(['used', 'new', 'needs_repair'] as const).map((c) => (
          <Chip key={c} selected={condition === c} onClick={() => onChange({ condition: [c] })}>
            {d(`carCondition.${c}`)}
          </Chip>
        ))}
      </div>
      <CarPairs value={value.car} onChange={(car) => onChange({ car })} placeParams={placeParams} />
      <PriceFields value={value} onChange={onChange} />
      <RangeField
        label={t('year')}
        from={value.yearFrom}
        to={value.yearTo}
        locale={locale}
        grouping={false}
        onChange={(yearFrom, yearTo) => onChange({ yearFrom, yearTo })}
      />
      <RangeField
        label={t('mileage')}
        from={value.mileageFrom}
        to={value.mileageTo}
        locale={locale}
        onChange={(mileageFrom, mileageTo) => onChange({ mileageFrom, mileageTo })}
      />
      <Group title={t('fuel')}>
        <div className="flex flex-col gap-3">
          {FUEL_TYPES.map((fuel) => (
            <Checkbox
              key={fuel}
              checked={value.fuel.includes(fuel)}
              label={d(`fuel.${fuel}`)}
              onChange={(on) =>
                onChange({
                  fuel: on ? [...value.fuel, fuel] : value.fuel.filter((f) => f !== fuel),
                })
              }
            />
          ))}
        </div>
      </Group>
      <OneOf
        label={t('transmission')}
        value={value.transmission}
        values={TRANSMISSIONS}
        labelOf={(v) => d(`transmission.${v}`)}
        onChange={(transmission) => onChange({ transmission })}
      />
      <OneOf
        label={t('bodyType')}
        value={value.bodyType}
        values={BODY_TYPES}
        labelOf={(v) => d(`bodyType.${v}`)}
        onChange={(bodyType) => onChange({ bodyType })}
      />
      <OneOf
        label={t('drive')}
        value={value.drive}
        values={DRIVES}
        labelOf={(v) => d(`drive.${v}`)}
        onChange={(drive) => onChange({ drive })}
      />
      {more ? (
        <>
          {onlyElectric ? null : (
            <RangeField
              label={t('engine')}
              from={value.engineFrom}
              to={value.engineTo}
              locale={locale}
              onChange={(engineFrom, engineTo) => onChange({ engineFrom, engineTo })}
            />
          )}
          <RangeField
            label={t('power')}
            from={value.powerFrom}
            to={value.powerTo}
            locale={locale}
            onChange={(powerFrom, powerTo) => onChange({ powerFrom, powerTo })}
          />
          <OneOf
            label={t('steering')}
            value={value.steering}
            values={STEERINGS}
            labelOf={(v) => d(`steering.${v}`)}
            onChange={(steering) => onChange({ steering })}
          />
          <OneOf
            label={t('color')}
            value={value.color}
            values={COLORS}
            labelOf={(v) => d(`color.${v}`)}
            onChange={(color) => onChange({ color })}
          />
          <Group title={t('registration')}>
            <ChipMulti
              options={REGISTRATIONS.map((r) => ({ value: r, label: d(`registration.${r}`) }))}
              value={value.registration}
              onChange={(registration) => onChange({ registration })}
            />
          </Group>
          <Switch
            checked={value.exchange ?? false}
            onChange={(exchange) => onChange({ exchange: exchange || null })}
            label={t('exchange')}
          />
          <PostedField value={value} onChange={onChange} />
        </>
      ) : (
        <button
          type="button"
          onClick={() => setMore(true)}
          className="self-start text-label font-semibold text-accent-text"
        >
          {t('more')}
        </button>
      )}
    </div>
  );
}

/** Category tree for a select: roots and their children, "Шины → Летние". */
function useCategoryTree(kind: 'goods' | 'service') {
  const query = useListCategories({ kind });
  const list = useMemo(() => (query.data?.status === 200 ? query.data.data : []), [query.data]);
  return useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (const root of list.filter((c) => !c.parentId)) {
      options.push({ value: root.slug, label: root.name });
      for (const child of list.filter((c) => c.parentId === root.id)) {
        options.push({ value: child.slug, label: `${root.name} → ${child.name}` });
      }
    }
    return { options, bySlug: new Map(list.map((c) => [c.slug, c])) };
  }, [list]);
}

/** Filters that depend on the goods category: tyre sizes, disk drilling, part type. */
function AttributeFilters({
  category,
  value,
  onChange,
}: {
  category: CategoryDto;
  value: FeedFilters;
  onChange: Change;
}) {
  const d = useTranslations('dict');
  const t = useTranslations('filters');
  const set = (key: string, values: string[]) => {
    const attrs = Object.fromEntries(
      Object.entries({ ...value.attrs, [key]: values }).filter(([, list]) => list.length > 0),
    );
    onChange({ attrs });
  };
  const label = (key: string) => (d.has(`attr.${key}`) ? d(`attr.${key}`) : key);
  return (
    <>
      {category.attributes
        .filter((a) => a.filterable && a.key !== 'oem' && a.key !== 'quantity')
        .map((attribute) => {
          const current = value.attrs[attribute.key] ?? [];
          if (attribute.type === 'enum' && attribute.options) {
            return (
              <Group key={attribute.key} title={label(attribute.key)}>
                <ChipMulti
                  options={attribute.options.map((option) => ({
                    value: option,
                    label: d.has(`attrOption.${attribute.key}.${option}`)
                      ? d(`attrOption.${attribute.key}.${option}`)
                      : option,
                  }))}
                  value={current}
                  onChange={(values) => set(attribute.key, values)}
                />
              </Group>
            );
          }
          if (attribute.type === 'bool') {
            return (
              <Checkbox
                key={attribute.key}
                checked={current[0] === 'true'}
                label={label(attribute.key)}
                onChange={(on) => set(attribute.key, on ? ['true'] : [])}
              />
            );
          }
          return (
            <label key={attribute.key} className="flex flex-col gap-1.5">
              <span className="text-label">{label(attribute.key)}</span>
              <input
                defaultValue={current[0] ?? ''}
                placeholder={t('any')}
                inputMode={attribute.type === 'number' ? 'decimal' : 'text'}
                onBlur={(event) => {
                  const next = event.target.value.trim();
                  if (next !== (current[0] ?? '')) set(attribute.key, next ? [next] : []);
                }}
                className="h-13 rounded-md bg-surface px-4 text-body outline-none placeholder:text-text-muted focus:ring-2 focus:ring-text"
              />
            </label>
          );
        })}
    </>
  );
}

/** "Подходит для моей машины": brand, model, year of the buyer's car (parts). */
function CompatibilityField({ value, onChange }: { value: FeedFilters; onChange: Change }) {
  const t = useTranslations('filters');
  const locale = useLocale();
  const brands = useListBrands();
  const list = brands.data?.status === 200 ? brands.data.data : [];
  const [brandId, setBrandId] = useState('');
  const models = useListModels(brandId, { query: { enabled: Boolean(brandId) } });
  const modelList = models.data?.status === 200 ? models.data.data : [];
  return (
    <Group title={t('compatibility')}>
      <Select
        label={t('brand')}
        placeholder={t('any')}
        value={brandId}
        options={list.map((b) => ({ value: b.id, label: b.name }))}
        onChange={(event) => {
          setBrandId(event.target.value);
          onChange({ compatModel: null, compatYear: null });
        }}
      />
      <Select
        label={t('model')}
        placeholder={t('any')}
        value={value.compatModel ?? ''}
        disabled={!brandId && !value.compatModel}
        options={modelList.map((m) => ({ value: m.id, label: m.name }))}
        onChange={(event) => onChange({ compatModel: event.target.value || null })}
      />
      <span className="text-label">{t('compatYear')}</span>
      <NumberBox
        value={value.compatYear}
        onCommit={(compatYear) => onChange({ compatYear })}
        placeholder={t('any')}
        label={t('compatYear')}
        locale={locale}
        grouping={false}
      />
    </Group>
  );
}

function GoodsFilters({ value, onChange }: { value: FeedFilters; onChange: Change }) {
  const t = useTranslations('filters');
  const d = useTranslations('dict');
  const { options, bySlug } = useCategoryTree('goods');
  const category = value.category ? bySlug.get(value.category) : undefined;
  const root = category?.parentId
    ? [...bySlug.values()].find((c) => c.id === category.parentId)
    : category;
  const condition = value.condition.length === 1 ? value.condition[0] : null;
  return (
    <div className="flex flex-col gap-6">
      <Select
        label={t('category')}
        placeholder={t('allCategories')}
        value={value.category ?? ''}
        options={options}
        // Changing the category resets its own filters.
        onChange={(event) =>
          onChange({
            category: event.target.value || null,
            attrs: {},
            compatModel: null,
            compatYear: null,
          })
        }
      />
      <div className="flex flex-wrap gap-2">
        <Chip selected={!condition} onClick={() => onChange({ condition: [] })}>
          {t('all')}
        </Chip>
        {(['new', 'used'] as const).map((c) => (
          <Chip key={c} selected={condition === c} onClick={() => onChange({ condition: [c] })}>
            {d(`goodsCondition.${c}`)}
          </Chip>
        ))}
      </div>
      {category ? <AttributeFilters category={category} value={value} onChange={onChange} /> : null}
      {root && ['parts', 'electronics', 'accessories'].includes(root.slug) ? (
        <CompatibilityField value={value} onChange={onChange} />
      ) : null}
      <PriceFields value={value} onChange={onChange} />
      <PostedField value={value} onChange={onChange} />
    </div>
  );
}

function ServiceFilters({ value, onChange }: { value: FeedFilters; onChange: Change }) {
  const t = useTranslations('filters');
  const { options } = useCategoryTree('service');
  const brands = useListBrands();
  const list = brands.data?.status === 200 ? brands.data.data : [];
  return (
    <div className="flex flex-col gap-6">
      <Select
        label={t('category')}
        placeholder={t('allCategories')}
        value={value.category ?? ''}
        options={options}
        onChange={(event) => onChange({ category: event.target.value || null })}
      />
      <Select
        label={t('servedBrand')}
        placeholder={t('anyBrand')}
        value={value.servedBrand.length === 1 ? value.servedBrand[0] : ''}
        options={list.map((b) => ({ value: b.slug, label: b.name }))}
        onChange={(event) =>
          onChange({ servedBrand: event.target.value ? [event.target.value] : [] })
        }
      />
      <Switch
        checked={value.mobile ?? false}
        onChange={(mobile) => onChange({ mobile: mobile || null })}
        label={t('mobile')}
      />
      <PriceFields value={value} onChange={onChange} />
      <PostedField value={value} onChange={onChange} />
    </div>
  );
}

/** Filter fields of a feed; used by the phone sheet (draft) and the desktop sidebar (live). */
export function FiltersForm({
  type,
  value,
  onChange,
  placeParams,
}: {
  type: ListingType;
  value: FeedFilters;
  onChange: Change;
  placeParams: Partial<SearchListingsParams>;
}) {
  if (type === 'car')
    return <CarFilters value={value} onChange={onChange} placeParams={placeParams} />;
  if (type === 'goods') return <GoodsFilters value={value} onChange={onChange} />;
  return <ServiceFilters value={value} onChange={onChange} />;
}
