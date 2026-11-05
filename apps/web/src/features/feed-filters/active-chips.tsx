'use client';

import type { Currency, ListingType } from '@clickauto/shared';
import { Chip } from '@clickauto/ui';
import { useLocale, useTranslations } from 'next-intl';
import { relevantFilters, type FeedFilters } from '@/entities/feed/filters';
import { useListBrands, useListModels } from '@/shared/api/generated/catalog/catalog';
import { formatNumber, formatPrice } from '@/shared/lib/format';
import { CloseIcon } from '@/shared/ui/icons';

export interface ActiveChip {
  key: string;
  label: string;
  /** Filters without this chip. */
  without: FeedFilters;
}

function rangeLabel(
  from: number | null,
  to: number | null,
  fmt: (value: number) => string,
  t: (key: 'fromValue' | 'toValue' | 'range', values: Record<string, string>) => string,
): string | null {
  if (from !== null && to !== null) return t('range', { from: fmt(from), to: fmt(to) });
  if (from !== null) return t('fromValue', { value: fmt(from) });
  if (to !== null) return t('toValue', { value: fmt(to) });
  return null;
}

/** Chips of the applied filters (design 02): "до 45 000 $", "2015–2020", "Бензин". */
export function useActiveChips(type: ListingType, all: FeedFilters): ActiveChip[] {
  const t = useTranslations('filters');
  const d = useTranslations('dict');
  const locale = useLocale();
  const brands = useListBrands();
  const brandName = (slug: string) =>
    (brands.data?.status === 200 ? brands.data.data : []).find((b) => b.slug === slug)?.name ??
    slug;
  const filters = relevantFilters(type, all);
  const chips: ActiveChip[] = [];
  const add = (key: string, label: string | null, patch: Partial<FeedFilters>) => {
    if (label) chips.push({ key, label, without: { ...all, ...patch } });
  };
  const chipT = (key: 'fromValue' | 'toValue' | 'range', values: Record<string, string>) =>
    t(`chip.${key}`, values);
  const num = (unit: string) => (value: number) => `${formatNumber(value, locale)} ${unit}`;

  for (const pair of filters.car) {
    add(`car-${pair}`, pair, { car: filters.car.filter((p) => p !== pair) });
  }
  const currency: Currency = filters.priceCurrency ?? 'USD';
  add(
    'price',
    rangeLabel(
      filters.priceFrom,
      filters.priceTo,
      (v) => formatPrice(v * 100, currency, locale),
      chipT,
    ),
    { priceFrom: null, priceTo: null, negotiable: null },
  );
  add('year', rangeLabel(filters.yearFrom, filters.yearTo, String, chipT), {
    yearFrom: null,
    yearTo: null,
  });
  add('mileage', rangeLabel(filters.mileageFrom, filters.mileageTo, num(t('units.km')), chipT), {
    mileageFrom: null,
    mileageTo: null,
  });
  add('engine', rangeLabel(filters.engineFrom, filters.engineTo, num(t('units.cc')), chipT), {
    engineFrom: null,
    engineTo: null,
  });
  add('power', rangeLabel(filters.powerFrom, filters.powerTo, num(t('units.hp')), chipT), {
    powerFrom: null,
    powerTo: null,
  });

  const conditionDict = type === 'car' ? 'carCondition' : 'goodsCondition';
  for (const value of filters.condition) {
    add(`condition-${value}`, d(`${conditionDict}.${value}`), {
      condition: filters.condition.filter((v) => v !== value),
    });
  }
  const lists = [
    ['fuel', 'fuel'],
    ['transmission', 'transmission'],
    ['bodyType', 'bodyType'],
    ['drive', 'drive'],
    ['steering', 'steering'],
    ['color', 'color'],
    ['registration', 'registration'],
  ] as const;
  for (const [key, dict] of lists) {
    const values = filters[key] as readonly string[];
    for (const value of values) {
      add(`${key}-${value}`, d(`${dict}.${value}`), {
        [key]: values.filter((v) => v !== value),
      } as Partial<FeedFilters>);
    }
  }
  if (filters.exchange) add('exchange', t('exchange'), { exchange: null });
  if (filters.mobile) add('mobile', t('mobile'), { mobile: null });
  for (const slug of filters.servedBrand) {
    add(`served-${slug}`, brandName(slug), {
      servedBrand: filters.servedBrand.filter((s) => s !== slug),
    });
  }
  for (const [key, values] of Object.entries(filters.attrs)) {
    for (const value of values) {
      const name = d.has(`attr.${key}`) ? d(`attr.${key}`) : key;
      const option = d.has(`attrOption.${key}.${value}`) ? d(`attrOption.${key}.${value}`) : value;
      const attrs = { ...filters.attrs, [key]: values.filter((v) => v !== value) };
      add(`attr-${key}-${value}`, `${name}: ${option === 'true' ? t('yes') : option}`, { attrs });
    }
  }
  if (filters.compatModel) {
    add('compat', t('compatibilityChip'), { compatModel: null, compatYear: null });
  }
  if (filters.posted) add('posted', t('postedDays', { days: filters.posted }), { posted: null });
  return chips;
}

/** "Toyota Camry" for a "toyota:camry" pair: names come from the catalog. */
function PairLabel({ pair }: { pair: string }) {
  const [brandSlug = '', modelSlug] = pair.split(':');
  const brands = useListBrands();
  const brand = (brands.data?.status === 200 ? brands.data.data : []).find(
    (b) => b.slug === brandSlug,
  );
  const models = useListModels(brand?.id ?? '', {
    query: { enabled: Boolean(brand && modelSlug) },
  });
  const model = (models.data?.status === 200 ? models.data.data : []).find(
    (m) => m.slug === modelSlug,
  );
  return <>{[brand?.name ?? brandSlug, model?.name ?? modelSlug].filter(Boolean).join(' ')}</>;
}

export function ActiveChips({
  chips,
  onChange,
}: {
  chips: ActiveChip[];
  onChange: (filters: FeedFilters) => void;
}) {
  const t = useTranslations('filters');
  return (
    <>
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          size="sm"
          onClick={() => onChange(chip.without)}
          aria-label={t('removeChip', { name: chip.label })}
        >
          {chip.key.startsWith('car-') ? <PairLabel pair={chip.label} /> : chip.label}
          <CloseIcon className="size-4" />
        </Chip>
      ))}
    </>
  );
}
