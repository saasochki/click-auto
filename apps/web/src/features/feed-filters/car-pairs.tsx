'use client';

import { CAR_PAIRS_MAX } from '@clickauto/shared';
import { Select } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useSearchListings } from '@/shared/api/generated/listings/listings';
import { useListBrands, useListModels } from '@/shared/api/generated/catalog/catalog';
import type { BrandDto, SearchListingsParams } from '@/shared/api/generated/model';
import { CloseIcon, PlusIcon } from '@/shared/ui/icons';

/** One "Марка → Модель" pair. Models show their listing counts; empty ones go last. */
function PairRow({
  pair,
  brands,
  placeParams,
  onChange,
  onRemove,
}: {
  pair: string;
  brands: BrandDto[];
  placeParams: Partial<SearchListingsParams>;
  onChange: (pair: string | null) => void;
  onRemove?: () => void;
}) {
  const t = useTranslations('filters');
  const [brandSlug = '', modelSlug = ''] = pair.split(':');
  const brand = brands.find((b) => b.slug === brandSlug);
  const models = useListModels(brand?.id ?? '', { query: { enabled: Boolean(brand) } });
  const counts = useSearchListings(
    { type: 'car', car: [brandSlug], facets: ['model'], limit: 1, ...placeParams },
    { query: { enabled: Boolean(brand) } },
  );
  const facet = counts.data?.status === 200 ? (counts.data.data.facets?.model ?? {}) : {};
  const modelOptions = useMemo(() => {
    const list = models.data?.status === 200 ? models.data.data : [];
    return list
      .map((model) => ({ model, count: facet[`${brandSlug}:${model.slug}`] ?? 0 }))
      .sort((a, b) => Number(b.count > 0) - Number(a.count > 0))
      .map(({ model, count }) => ({
        value: model.slug,
        label: count ? `${model.name} (${count})` : model.name,
      }));
  }, [models.data, facet, brandSlug]);

  return (
    <div className="flex items-end gap-2">
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <Select
          label={t('brand')}
          placeholder={t('any')}
          value={brandSlug}
          options={brands.map((b) => ({ value: b.slug, label: b.name }))}
          onChange={(event) => onChange(event.target.value || null)}
        />
        <Select
          label={t('model')}
          placeholder={t('any')}
          value={modelSlug}
          disabled={!brand}
          options={modelOptions}
          // Changing or clearing the brand above already resets the model.
          onChange={(event) =>
            onChange(event.target.value ? `${brandSlug}:${event.target.value}` : brandSlug)
          }
        />
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t('removeBrand')}
          className="mb-1.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-muted hover:text-text"
        >
          <CloseIcon className="size-5" />
        </button>
      ) : null}
    </div>
  );
}

/** Up to 5 "brand" or "brand:model" pairs (docs/analytics/05-filters.md). */
export function CarPairs({
  value,
  onChange,
  placeParams,
}: {
  value: string[];
  onChange: (pairs: string[]) => void;
  placeParams: Partial<SearchListingsParams>;
}) {
  const t = useTranslations('filters');
  const brands = useListBrands();
  const list = brands.data?.status === 200 ? brands.data.data : [];
  // A new empty row lives here until a brand is picked: the URL never gets an empty pair.
  const [adding, setAdding] = useState(false);
  const rows = value.length === 0 || adding ? [...value, ''] : value;

  const update = (index: number, pair: string | null) => {
    const next = [...rows];
    if (pair) next[index] = pair;
    else next.splice(index, 1);
    setAdding(false);
    onChange(next.filter(Boolean));
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.map((pair, index) => (
        <PairRow
          key={`${index}-${pair.split(':')[0]}`}
          pair={pair}
          brands={list}
          placeParams={placeParams}
          onChange={(next) => update(index, next)}
          onRemove={rows.length > 1 ? () => update(index, null) : undefined}
        />
      ))}
      {value.length > 0 && !adding && value.length < CAR_PAIRS_MAX ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 self-start text-label font-semibold text-accent-text"
        >
          <PlusIcon className="size-4" />
          {t('addBrand')}
        </button>
      ) : null}
    </div>
  );
}
