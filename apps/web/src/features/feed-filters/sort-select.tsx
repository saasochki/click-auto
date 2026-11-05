'use client';

import type { ListingType, SearchSort } from '@clickauto/shared';
import { useTranslations } from 'next-intl';
import { SortIcon } from '@/shared/ui/icons';

const CAR_SORTS: SearchSort[] = [
  'date_desc',
  'price_asc',
  'price_desc',
  'mileage_asc',
  'year_desc',
];
const OTHER_SORTS: SearchSort[] = ['date_desc', 'price_asc', 'price_desc'];

/**
 * "⇅ Сначала новые": a native select under a text button, so the phone shows its own picker.
 * Text search without a chosen sort is ranked by relevance.
 */
export function SortSelect({
  type,
  value,
  hasText,
  onChange,
}: {
  type: ListingType;
  value: SearchSort | null;
  hasText: boolean;
  onChange: (sort: SearchSort | null) => void;
}) {
  const t = useTranslations('sort');
  const options = type === 'car' ? CAR_SORTS : OTHER_SORTS;
  const current = value ?? (hasText ? 'relevance' : 'date_desc');
  return (
    <label className="relative inline-flex h-10 items-center gap-1.5 text-label font-semibold">
      <SortIcon className="size-5" />
      <span>{t(current)}</span>
      <select
        aria-label={t('label')}
        value={current}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === 'relevance' ? null : (next as SearchSort));
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {hasText ? <option value="relevance">{t('relevance')}</option> : null}
        {options.map((sort) => (
          <option key={sort} value={sort}>
            {t(sort)}
          </option>
        ))}
      </select>
    </label>
  );
}
