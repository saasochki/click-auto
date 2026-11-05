'use client';

import type { Currency, ListingType } from '@clickauto/shared';
import { Checkbox, Chip, ChipMulti, Segmented, Select, Switch } from '@clickauto/ui';
import { keepPreviousData } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';
import {
  filterConfigParams,
  paramFlag,
  paramList,
  paramNumber,
  patchParam,
  resetPatch,
  type FeedFilters,
} from '@/entities/feed/filters';
import {
  useGetFilterConfig,
  useListBrands,
  useListModels,
} from '@/shared/api/generated/catalog/catalog';
import type {
  FilterConfigDtoFieldsItem as FilterField,
  FilterConfigDtoFieldsItemOptionsItem as FilterOption,
  SearchListingsParams,
} from '@/shared/api/generated/model';
import { CarPairs } from './car-pairs';
import { NumberBox, RangeField } from './range-field';

type Change = (patch: Partial<FeedFilters>) => void;

interface FieldProps {
  field: FilterField;
  value: FeedFilters;
  onChange: Change;
}

const CURRENCY_LABEL: Record<Currency, 'usd' | 'eur' | 'prb' | 'mdl'> = {
  USD: 'usd',
  EUR: 'eur',
  PRB: 'prb',
  MDL: 'mdl',
};

/** Config changes rarely: one request per type and goods category. */
const CONFIG_STALE_MS = 10 * 60_000;

function Group({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-label">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Field and option labels: database values come translated, the rest from the dictionaries. */
function useLabels(field: FilterField) {
  const t = useTranslations('filters');
  const d = useTranslations('dict');
  const attr = field.key.startsWith('attr.') ? field.key.slice('attr.'.length) : null;
  const label = attr
    ? d.has(`attr.${attr}`)
      ? d(`attr.${attr}`)
      : attr
    : t.has(field.key)
      ? t(field.key)
      : field.key;
  const option = (o: FilterOption) => {
    if (o.label) return o.label;
    const key = `${field.dictionary ?? ''}.${o.value}`;
    return field.dictionary && d.has(key) ? d(key) : o.value;
  };
  return { label, option };
}

function PriceField({ field, value, onChange }: FieldProps) {
  const t = useTranslations('filters');
  const locale = useLocale();
  const [fromParam = '', toParam = '', currencyParam = '', negotiableParam = ''] = field.params;
  const currency = paramList(value, currencyParam)[0] ?? value.priceCurrency ?? 'USD';
  return (
    <RangeField
      label={t('price')}
      from={paramNumber(value, fromParam)}
      to={paramNumber(value, toParam)}
      locale={locale}
      onChange={(from, to) =>
        onChange({ ...patchParam(value, fromParam, from), ...patchParam(value, toParam, to) })
      }
    >
      <Segmented
        label={t('currency')}
        options={(field.options ?? []).map((o) => ({
          value: o.value,
          label: t(`currencies.${CURRENCY_LABEL[o.value as Currency]}`),
        }))}
        value={currency}
        onChange={(next) => onChange(patchParam(value, currencyParam, next))}
      />
      <Checkbox
        checked={paramFlag(value, negotiableParam)}
        onChange={(on) => onChange(patchParam(value, negotiableParam, on))}
        label={t('showNegotiable')}
      />
    </RangeField>
  );
}

function PostedField({ field, value, onChange }: FieldProps) {
  const t = useTranslations('filters');
  const param = field.params[0] ?? '';
  const current = paramNumber(value, param);
  return (
    <Group title={t('posted')}>
      <div className="flex flex-wrap gap-2">
        <Chip selected={current === null} onClick={() => onChange(patchParam(value, param, null))}>
          {t('postedAny')}
        </Chip>
        {(field.options ?? []).map((o) => {
          const days = Number(o.value);
          return (
            <Chip
              key={o.value}
              selected={current === days}
              onClick={() => onChange(patchParam(value, param, days))}
            >
              {t('postedDays', { days })}
            </Chip>
          );
        })}
      </div>
    </Group>
  );
}

/** Category tree as a select: "Шины → Летние". Changing it resets the fields it lists. */
function CategoryField({ field, value, onChange }: FieldProps) {
  const t = useTranslations('filters');
  const options = useMemo(() => {
    const list = field.options ?? [];
    const names = new Map(list.map((o) => [o.value, o.label ?? o.value]));
    const result: { value: string; label: string }[] = [];
    for (const root of list.filter((o) => !o.parent)) {
      result.push({ value: root.value, label: names.get(root.value) ?? root.value });
      for (const child of list.filter((o) => o.parent === root.value)) {
        result.push({ value: child.value, label: `${names.get(root.value)} → ${child.label}` });
      }
    }
    return result;
  }, [field.options]);
  return (
    <Select
      label={t('category')}
      placeholder={t('allCategories')}
      value={value.category ?? ''}
      options={options}
      onChange={(event) =>
        onChange({ ...resetPatch(field.resets), category: event.target.value || null })
      }
    />
  );
}

/** "Подходит для моей машины": brand, model and year of the buyer's car (parts). */
function CompatibilityField({ field, value, onChange }: FieldProps) {
  const t = useTranslations('filters');
  const locale = useLocale();
  const [modelParam = '', yearParam = ''] = field.params;
  const brands = useListBrands();
  const list = brands.data?.status === 200 ? brands.data.data : [];
  const [brandId, setBrandId] = useState('');
  const models = useListModels(brandId, { query: { enabled: Boolean(brandId) } });
  const modelList = models.data?.status === 200 ? models.data.data : [];
  const model = value.compatModel;
  return (
    <Group title={t('compatibility')}>
      <Select
        label={t('brand')}
        placeholder={t('any')}
        value={brandId}
        options={list.map((b) => ({ value: b.id, label: b.name }))}
        onChange={(event) => {
          setBrandId(event.target.value);
          onChange({
            ...patchParam(value, modelParam, null),
            ...patchParam(value, yearParam, null),
          });
        }}
      />
      <Select
        label={t('model')}
        placeholder={t('any')}
        value={model ?? ''}
        disabled={!brandId && !model}
        options={modelList.map((m) => ({ value: m.id, label: m.name }))}
        onChange={(event) => onChange(patchParam(value, modelParam, event.target.value || null))}
      />
      <span className="text-label">{t('compatYear')}</span>
      <NumberBox
        value={paramNumber(value, yearParam)}
        onCommit={(year) => onChange(patchParam(value, yearParam, year))}
        placeholder={t('any')}
        label={t('compatYear')}
        locale={locale}
        grouping={false}
      />
    </Group>
  );
}

/** One field of the config; the kind decides the control. */
function Field({
  field,
  value,
  onChange,
  placeParams,
}: FieldProps & { placeParams: Partial<SearchListingsParams> }) {
  const t = useTranslations('filters');
  const locale = useLocale();
  const { label, option } = useLabels(field);
  const param = field.params[0] ?? '';
  const options = field.options ?? [];
  const set = (next: string[] | number | boolean | null) =>
    onChange({ ...patchParam(value, param, next), ...resetPatch(field.resets) });

  switch (field.kind) {
    case 'chips': {
      const current = paramList(value, param);
      const one = current.length === 1 ? current[0] : null;
      return (
        <div className="flex flex-wrap gap-2">
          <Chip selected={!one} onClick={() => set([])}>
            {t('all')}
          </Chip>
          {options.map((o) => (
            <Chip key={o.value} selected={one === o.value} onClick={() => set([o.value])}>
              {option(o)}
            </Chip>
          ))}
        </div>
      );
    }
    case 'checkboxes': {
      const current = paramList(value, param);
      return (
        <Group title={label}>
          <div className="flex flex-col gap-3">
            {options.map((o) => (
              <Checkbox
                key={o.value}
                checked={current.includes(o.value)}
                label={option(o)}
                onChange={(on) =>
                  set(on ? [...current, o.value] : current.filter((v) => v !== o.value))
                }
              />
            ))}
          </div>
        </Group>
      );
    }
    case 'chip_multi':
      return (
        <Group title={label}>
          <ChipMulti
            options={options.map((o) => ({ value: o.value, label: option(o) }))}
            value={paramList(value, param)}
            onChange={set}
          />
        </Group>
      );
    case 'select': {
      const current = paramList(value, param);
      return (
        <Select
          label={label}
          placeholder={t('any')}
          value={current.length === 1 ? (current[0] ?? '') : ''}
          options={options.map((o) => ({ value: o.value, label: option(o) }))}
          onChange={(event) => set(event.target.value ? [event.target.value] : [])}
        />
      );
    }
    case 'range': {
      const [fromParam = '', toParam = ''] = field.params;
      return (
        <RangeField
          label={label}
          from={paramNumber(value, fromParam)}
          to={paramNumber(value, toParam)}
          locale={locale}
          grouping={field.grouping ?? true}
          onChange={(from, to) =>
            onChange({ ...patchParam(value, fromParam, from), ...patchParam(value, toParam, to) })
          }
        />
      );
    }
    case 'switch':
      return <Switch checked={paramFlag(value, param)} onChange={set} label={label} />;
    case 'checkbox':
      return <Checkbox checked={paramFlag(value, param)} onChange={set} label={label} />;
    case 'price':
      return <PriceField field={field} value={value} onChange={onChange} />;
    case 'posted':
      return <PostedField field={field} value={value} onChange={onChange} />;
    case 'car_pairs':
      return (
        <CarPairs
          value={paramList(value, param)}
          onChange={(car) => onChange(patchParam(value, param, car))}
          placeParams={placeParams}
        />
      );
    case 'category':
      return <CategoryField field={field} value={value} onChange={onChange} />;
    case 'compatibility':
      return <CompatibilityField field={field} value={value} onChange={onChange} />;
    case 'text': {
      const current = paramList(value, param)[0] ?? '';
      return (
        <label className="flex flex-col gap-1.5">
          <span className="text-label">{label}</span>
          <input
            // Remount when the value changes from outside (reset, chip removed).
            key={current}
            defaultValue={current}
            placeholder={t('any')}
            onBlur={(event) => {
              const next = event.target.value.trim();
              if (next !== current) set(next ? [next] : []);
            }}
            className="h-13 rounded-md bg-surface px-4 text-body outline-none placeholder:text-text-muted focus:ring-2 focus:ring-text"
          />
        </label>
      );
    }
    default:
      return null;
  }
}

function isHidden(field: FilterField, value: FeedFilters): boolean {
  if (!field.hiddenWhen) return false;
  const current = paramList(value, field.hiddenWhen.param);
  const only = field.hiddenWhen.only;
  return current.length === only.length && only.every((v) => current.includes(v));
}

/**
 * Filter fields of a feed, rendered from GET /catalog/filters
 * (docs/frontend/02-architecture.md#фильтры). Used by the phone sheet (draft) and the desktop
 * sidebar (live). Goods ask for the config of the chosen category: it adds attribute filters.
 */
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
  const t = useTranslations('filters');
  const [more, setMore] = useState(false);
  const config = useGetFilterConfig(filterConfigParams(type, value), {
    query: { placeholderData: keepPreviousData, staleTime: CONFIG_STALE_MS },
  });
  const fields = config.data?.status === 200 ? config.data.data.fields : [];
  const visible = fields.filter((field) => !isHidden(field, value));
  const main = visible.filter((field) => !field.advanced);
  const advanced = visible.filter((field) => field.advanced);

  if (config.isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-13 animate-pulse rounded-md bg-surface" />
        ))}
      </div>
    );
  }

  const render = (field: FilterField) => (
    <Field
      key={field.key}
      field={field}
      value={value}
      onChange={onChange}
      placeParams={placeParams}
    />
  );
  return (
    <div className="flex flex-col gap-6">
      {main.map(render)}
      {advanced.length === 0 ? null : more ? (
        advanced.map(render)
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
