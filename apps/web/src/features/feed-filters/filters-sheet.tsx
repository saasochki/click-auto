'use client';

import type { ListingType } from '@clickauto/shared';
import { Button, Sheet } from '@clickauto/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { clearedFilters, toSearchParams, type FeedFilters } from '@/entities/feed/filters';
import { useCountListings } from '@/shared/api/generated/listings/listings';
import type { SearchListingsParams } from '@/shared/api/generated/model';
import { formatNumber } from '@/shared/lib/format';
import type { Place } from '@/shared/lib/place';
import { FiltersForm } from './filters-form';

/**
 * Phone filters (design 03): edits a draft, shows how many listings it will find
 * and applies only on "Показать N".
 */
export function FiltersSheet({
  type,
  filters,
  place,
  placeParams,
  onApply,
  onClose,
}: {
  type: ListingType;
  filters: FeedFilters;
  place: Place | null;
  placeParams: Partial<SearchListingsParams>;
  onApply: (filters: FeedFilters) => void;
  onClose: () => void;
}) {
  const t = useTranslations('filters');
  const locale = useLocale();
  const [draft, setDraft] = useState(filters);
  const count = useCountListings(toSearchParams(type, draft, place), {
    query: { placeholderData: (previous) => previous },
  });
  const total = count.data?.status === 200 ? count.data.data.total : null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('title')}
      closeLabel={t('close')}
      tall
      footer={
        <div className="flex gap-3">
          <Button kind="ghost" size="lg" onClick={() => setDraft(clearedFilters(type, draft))}>
            {t('reset')}
          </Button>
          <Button kind="primary" size="lg" className="flex-1" onClick={() => onApply(draft)}>
            {total === null ? t('show') : t('showCount', { count: formatNumber(total, locale) })}
          </Button>
        </div>
      }
    >
      <FiltersForm
        type={type}
        value={draft}
        onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
        placeParams={placeParams}
      />
    </Sheet>
  );
}
