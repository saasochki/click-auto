'use client';

import { useTranslations } from 'next-intl';
import { useListRegions } from '@/shared/api/generated/catalog/catalog';
import type { Place } from '@/shared/lib/place';

/** Label of the current place for the header pill: "Тирасполь", "ПМР", "Все регионы". */
export function usePlaceLabel(place: Place | null): string {
  const t = useTranslations('place');
  const regions = useListRegions();
  const list = regions.data?.status === 200 ? regions.data.data : [];
  if (!place || place.kind === 'all') return t('all');
  if (place.kind === 'country') return t(`country.${place.country}`);
  for (const region of list) {
    if (place.kind === 'region' && region.slug === place.slug) return region.name;
    const city = region.cities.find((c) => c.slug === place.slug);
    if (place.kind === 'city' && city) return city.name;
  }
  return t('all');
}
