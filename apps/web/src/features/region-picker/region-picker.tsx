'use client';

import type { Country } from '@clickauto/shared';
import { Button, cn, Segmented, Sheet } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useListRegions } from '@/shared/api/generated/catalog/catalog';
import type { RegionDto } from '@/shared/api/generated/model';
import type { Place } from '@/shared/lib/place';
import { CheckIcon, SearchIcon } from '@/shared/ui/icons';

interface Row {
  key: string;
  place: Place;
  label: string;
  /** City inside a region listed above it. */
  nested?: boolean;
  strong?: boolean;
}

function samePlace(a: Place | null, b: Place): boolean {
  if (!a || a.kind !== b.kind) return false;
  if (a.kind === 'country' && b.kind === 'country') return a.country === b.country;
  if ((a.kind === 'region' || a.kind === 'city') && (b.kind === 'region' || b.kind === 'city'))
    return a.slug === b.slug;
  return true;
}

/**
 * Rows of one country: a region whose only city has the same name (Тирасполь, Бендеры) is one
 * row for the city; other regions get a "whole region" row followed by their cities.
 */
function rowsOf(regions: RegionDto[], country: Country, query: string): Row[] {
  const needle = query.trim().toLowerCase();
  const rows: Row[] = [];
  for (const region of regions.filter((r) => r.country === country)) {
    const single = region.cities.length === 1 && region.cities[0]?.name === region.name;
    if (single && region.cities[0]) {
      const city = region.cities[0];
      rows.push({ key: city.id, place: { kind: 'city', slug: city.slug }, label: city.name });
      continue;
    }
    rows.push({
      key: region.id,
      place: { kind: 'region', slug: region.slug },
      label: region.name,
      strong: true,
    });
    for (const city of region.cities) {
      rows.push({
        key: city.id,
        place: { kind: 'city', slug: city.slug },
        label: city.name,
        nested: true,
      });
    }
  }
  if (!needle) return rows;
  return rows
    .filter((row) => row.label.toLowerCase().includes(needle))
    .map((row) => ({ ...row, nested: false }));
}

/** "Где ищем?" (design 04): country tabs, city search, a region or a city, or everything. */
export function RegionPicker({
  open,
  onClose,
  current,
  geoFailed,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  current: Place | null;
  /** Geolocation was denied or found nothing: explain why the sheet opened. */
  geoFailed: boolean;
  onSelect: (place: Place) => void;
}) {
  const t = useTranslations('place');
  const regions = useListRegions({ query: { enabled: open } });
  const list = regions.data?.status === 200 ? regions.data.data : [];
  const [country, setCountry] = useState<Country>(
    current?.kind === 'country' ? current.country : 'pmr',
  );
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Place | null>(current);
  const rows = useMemo(() => rowsOf(list, country, query), [list, country, query]);

  const options: Row[] = query
    ? rows
    : [
        { key: 'all', place: { kind: 'all' }, label: t('all') },
        {
          key: `country-${country}`,
          place: { kind: 'country', country },
          label: t(`allIn.${country}`),
        },
        ...rows,
      ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('title')}
      closeLabel={t('close')}
      tall
      footer={
        <Button
          kind="primary"
          size="lg"
          className="w-full"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          {t('done')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {geoFailed ? <p className="text-label text-text-muted">{t('geoFailed')}</p> : null}
        <Segmented
          label={t('countryLabel')}
          options={[
            { value: 'pmr', label: t('country.pmr') },
            { value: 'md', label: t('country.md') },
          ]}
          value={country}
          onChange={setCountry}
        />
        <label className="flex h-12 items-center gap-3 rounded-lg bg-surface px-4">
          <SearchIcon className="size-5 shrink-0 text-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search')}
            className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-text-muted"
          />
        </label>
        <ul className="flex flex-col">
          {options.map((row) => {
            const active = samePlace(selected, row.place);
            return (
              <li key={row.key}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(row.place)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 border-b border-border py-3.5 text-left text-body',
                    row.nested && 'pl-4',
                    (active || row.strong) && 'font-semibold',
                  )}
                >
                  {row.label}
                  {active ? <CheckIcon className="size-5 shrink-0 text-accent-text" /> : null}
                </button>
              </li>
            );
          })}
          {query && rows.length === 0 ? (
            <li className="py-6 text-center text-label text-text-muted">{t('nothing')}</li>
          ) : null}
        </ul>
      </div>
    </Sheet>
  );
}
