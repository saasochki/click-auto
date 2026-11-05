'use client';

import type { ListingType, SearchSort } from '@clickauto/shared';
import { Button, Chip, cn } from '@clickauto/ui';
import { useInfiniteQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';
import { feedQueryOptions } from '@/entities/feed/feed-query';
import { clearedFilters, feedHref, hasOwnPlace, type FeedFilters } from '@/entities/feed/filters';
import {
  CarTile,
  CompactTile,
  ServiceRow,
  TileSkeleton,
  type ListingSummary,
} from '@/entities/listing/listing-tile';
import { ActiveChips, useActiveChips } from '@/features/feed-filters/active-chips';
import { FiltersForm } from '@/features/feed-filters/filters-form';
import { SortSelect } from '@/features/feed-filters/sort-select';
import { SearchField } from '@/features/search-field/search-field';
import { useListCategories } from '@/shared/api/generated/catalog/catalog';
import type { SearchListingsParams } from '@/shared/api/generated/model';
import { Link, useRouter } from '@/shared/i18n/routing';
import { formatNumber } from '@/shared/lib/format';
import { placeParams as placeToParams, type Place } from '@/shared/lib/place';
import { BackIcon, FiltersIcon, SearchIcon } from '@/shared/ui/icons';
import { SectionTabs } from '@/shared/ui/section-tabs';

/** The phone sheet loads only when opened. */
const FiltersSheet = dynamic(() =>
  import('@/features/feed-filters/filters-sheet').then((m) => m.FiltersSheet),
);

export interface Crumb {
  label: string;
  href?: string;
}

function Tiles({ type, items }: { type: ListingType; items: ListingSummary[] }) {
  if (type === 'service') {
    return (
      <ul className="grid gap-3 lg:grid-cols-2">
        {items.map((item, index) => (
          <li key={item.id}>
            <ServiceRow listing={item} priority={index < 2} />
          </li>
        ))}
      </ul>
    );
  }
  if (type === 'goods') {
    return (
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
        {items.map((item, index) => (
          <li key={item.id}>
            <CompactTile listing={item} priority={index < 4} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.id}>
          <CarTile listing={item} priority={index < 2} />
        </li>
      ))}
    </ul>
  );
}

function Skeletons({ type }: { type: ListingType }) {
  const variant = type === 'car' ? 'car' : type === 'goods' ? 'compact' : 'row';
  return (
    <div
      aria-hidden
      className={cn(
        'grid gap-4',
        type === 'goods' ? 'grid-cols-2 sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <TileSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}

/** "Ничего не нашлось" (design 35). */
function Empty({ onReset }: { onReset: () => void }) {
  const t = useTranslations('feed');
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-surface text-text-muted">
        <SearchIcon className="size-7" />
      </span>
      <h2 className="text-h2">{t('emptyTitle')}</h2>
      <p className="max-w-xs text-body text-text-muted">{t('emptyText')}</p>
      <Button kind="secondary" onClick={onReset}>
        {t('resetFilters')}
      </Button>
    </div>
  );
}

/** Root goods or service categories as chips: "Все · Шины · Диски · Запчасти". */
function CategoryChips({
  type,
  filters,
  go,
}: {
  type: 'goods' | 'service';
  filters: FeedFilters;
  go: (next: FeedFilters) => void;
}) {
  const t = useTranslations('filters');
  const query = useListCategories({ kind: type });
  const list = query.data?.status === 200 ? query.data.data : [];
  const current = list.find((c) => c.slug === filters.category);
  const activeRoot = current?.parentId
    ? list.find((c) => c.id === current.parentId)?.slug
    : current?.slug;
  const pick = (category: string | null) =>
    go({ ...filters, category, attrs: {}, compatModel: null, compatYear: null });
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6 lg:hidden">
      <Chip selected={!filters.category} onClick={() => pick(null)}>
        {t('all')}
      </Chip>
      {list
        .filter((c) => !c.parentId)
        .map((category) => (
          <Chip
            key={category.id}
            selected={activeRoot === category.slug}
            onClick={() => pick(category.slug)}
          >
            {category.name}
          </Chip>
        ))}
    </div>
  );
}

/**
 * A feed of cars, goods or services (design 02, 09, 21; desktop D2, D4, D6): search, filters,
 * applied chips, sort, infinite list with "Показать ещё" as a fallback for crawlers.
 * Filters come from the server props, which follow the URL; changes navigate.
 */
export function Feed({
  type,
  filters,
  place,
  params,
  title,
  crumbs,
}: {
  type: ListingType;
  filters: FeedFilters;
  place: Place | null;
  /** Query of the first page, exactly as prefetched on the server. */
  params: SearchListingsParams;
  title: string;
  crumbs: Crumb[];
}) {
  const t = useTranslations('feed');
  const tf = useTranslations('filters');
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const chips = useActiveChips(type, filters);
  const placeParams = hasOwnPlace(filters) ? {} : placeToParams(place);

  const go = (next: FeedFilters) =>
    startTransition(() => router.push(feedHref(type, next), { scroll: false }));

  const query = useInfiniteQuery(feedQueryOptions(params));
  const pages = query.data?.pages ?? [];
  const first = pages[0];
  const items = pages.flatMap((page) => (page.status === 200 ? page.data.items : []));
  const total = first?.status === 200 ? first.data.total : null;

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const reset = () => go(clearedFilters(type, filters));
  const setSort = (sort: SearchSort | null) => go({ ...filters, sort });
  const countLine =
    total === null
      ? null
      : type === 'car'
        ? t('count', { count: total, formatted: formatNumber(total, locale) })
        : `${title} · ${t('count', { count: total, formatted: formatNumber(total, locale) })}`;

  const filtersButton = (
    <button
      type="button"
      onClick={() => setSheetOpen(true)}
      aria-label={tf('title')}
      className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-contrast hover:bg-accent-hover lg:hidden"
    >
      <FiltersIcon className="size-5" />
    </button>
  );

  return (
    <div className="mx-auto max-w-page px-4 md:px-6">
      {/* Phone top: cars have "← search", goods and services the home-like search and tabs. */}
      <div className="flex flex-col gap-3 pt-3 lg:hidden">
        {type === 'car' ? (
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label={t('back')}
              className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-surface"
            >
              <BackIcon className="size-6" />
            </Link>
            <SearchField type={type} filters={filters} size="sm" className="h-12 flex-1" />
          </div>
        ) : (
          <>
            <SearchField type={type} filters={filters} action={filtersButton} />
            <SectionTabs active={type} />
            <CategoryChips type={type} filters={filters} go={go} />
          </>
        )}
        {type === 'car' || chips.length ? (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
            <Chip size="sm" selected onClick={() => setSheetOpen(true)}>
              {chips.length ? tf('buttonCount', { count: chips.length }) : tf('button')}
            </Chip>
            <ActiveChips chips={chips} onChange={go} />
          </div>
        ) : null}
      </div>

      {/* Desktop: breadcrumbs and title. */}
      <div className="hidden flex-col gap-2 pt-6 pb-4 lg:flex">
        <nav aria-label={t('breadcrumbs')} className="text-caption text-text-muted">
          <ol className="flex flex-wrap gap-1.5">
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex gap-1.5">
                {index > 0 ? <span aria-hidden>/</span> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-text">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-text">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="flex items-baseline gap-3 text-h1">
          {title}
          {total !== null ? (
            <span className="text-label text-text-muted">
              {t('count', { count: total, formatted: formatNumber(total, locale) })}
            </span>
          ) : null}
        </h1>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 flex-col gap-6 lg:flex">
          <FiltersForm
            type={type}
            value={filters}
            onChange={(patch) => go({ ...filters, ...patch })}
            placeParams={placeParams}
          />
          <Button kind="secondary" onClick={reset}>
            {t('resetFilters')}
          </Button>
        </aside>

        <section
          className="flex min-w-0 flex-1 flex-col gap-4"
          aria-busy={pending || query.isPending}
        >
          <div className="flex items-center justify-between gap-3 pt-2 lg:pt-0">
            <span className="text-label text-text-muted lg:hidden">{countLine}</span>
            <div className="hidden flex-wrap gap-2 lg:flex">
              <ActiveChips chips={chips} onChange={go} />
            </div>
            <SortSelect
              type={type}
              value={filters.sort}
              hasText={Boolean(filters.q)}
              onChange={setSort}
            />
          </div>

          <div className={cn('transition-opacity', pending && 'opacity-60')}>
            {query.isPending ? (
              <Skeletons type={type} />
            ) : query.isError || (first && first.status !== 200) ? (
              <p className="py-16 text-center text-body text-text-muted">{t('error')}</p>
            ) : items.length === 0 ? (
              <Empty onReset={reset} />
            ) : (
              <Tiles type={type} items={items} />
            )}
          </div>

          {hasNextPage ? (
            <div ref={sentinel} className="flex justify-center pt-4">
              <Button
                kind="secondary"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {t('more')}
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      {sheetOpen ? (
        <FiltersSheet
          type={type}
          filters={filters}
          place={place}
          placeParams={placeParams}
          onClose={() => setSheetOpen(false)}
          onApply={(next) => {
            setSheetOpen(false);
            go(next);
          }}
        />
      ) : null}
    </div>
  );
}
