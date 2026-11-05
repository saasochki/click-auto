'use client';

import { LISTING_STATUSES, type ListingStatus } from '@clickauto/shared';
import { Button, Chip } from '@clickauto/ui';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listingHref } from '@/entities/listing/listing-href';
import { ListingPrice } from '@/entities/listing/listing-meta';
import { ListingPhoto } from '@/entities/listing/listing-photo';
import { StatusBadge } from '@/entities/listing/status-badge';
import { ListingActions } from '@/features/listing-actions/listing-actions';
import {
  getListMyListingsQueryKey,
  listMyListings,
  useCountMyListings,
} from '@/shared/api/generated/me/me';
import type { ListingDto } from '@/shared/api/generated/model';
import { Link, useRouter } from '@/shared/i18n/routing';
import { formatDate } from '@/shared/lib/format';
import { PlusIcon } from '@/shared/ui/icons';

/** Tabs in the design order; removed and blocked are shown only when there is something in them. */
const TABS: readonly ListingStatus[] = ['active', 'hidden', 'draft', 'removed', 'blocked'];
const ALWAYS_SHOWN: readonly ListingStatus[] = ['active', 'hidden', 'draft'];

function isStatus(value: string | null): value is ListingStatus {
  return (LISTING_STATUSES as readonly string[]).includes(value ?? '');
}

function Row({
  listing,
  onDone,
}: {
  listing: ListingDto;
  onDone: Parameters<typeof ListingActions>[0]['onDone'];
}) {
  const t = useTranslations('myListings');
  const locale = useLocale();
  const date = listing.publishedAt ?? listing.createdAt;
  const href =
    listing.status === 'active' ? listingHref(listing) : `/me/listings/${listing.id}/edit`;
  return (
    <li className="flex gap-3 rounded-lg bg-surface p-3">
      <Link href={href} className="shrink-0">
        <ListingPhoto
          photo={listing.photos[0]}
          alt={listing.title}
          className="size-24 rounded-md"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link href={href} className="flex flex-col gap-0.5">
          <ListingPrice listing={listing} className="text-h3" />
          <span className="line-clamp-2 text-label">{listing.title}</span>
          <span className="text-caption text-text-muted">
            {t(listing.publishedAt ? 'publishedOn' : 'createdOn', {
              date: formatDate(date, locale),
            })}
          </span>
        </Link>
        <div>
          <StatusBadge status={listing.status} />
        </div>
      </div>
      <ListingActions listing={listing} onDone={onDone} />
    </li>
  );
}

/** "Мои объявления" (design 13, 37, 39): status tabs with counts, list, owner actions, toast. */
export function MyListings() {
  const t = useTranslations('myListings');
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('status');
  const status: ListingStatus = isStatus(raw) ? raw : 'active';
  const [toast, setToast] = useState<string | null>(null);

  const counts = useCountMyListings();
  const countMap = counts.data?.status === 200 ? counts.data.data : null;
  const total = countMap ? Object.values(countMap).reduce((sum, n) => sum + n, 0) : null;

  const query = { status, limit: 20 } as const;
  const list = useInfiniteQuery({
    queryKey: getListMyListingsQueryKey(query),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const res = await listMyListings({ ...query, cursor: pageParam });
      return res.data;
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const tabs = TABS.filter((tab) => ALWAYS_SHOWN.includes(tab) || (countMap?.[tab] ?? 0) > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {tabs.map((tab) => (
          <Chip
            key={tab}
            selected={tab === status}
            onClick={() => router.replace(`/me/listings?status=${tab}`)}
          >
            {t(`tabs.${tab}`)}
            {countMap ? ` · ${countMap[tab]}` : ''}
          </Chip>
        ))}
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-surface text-text-muted">
            <PlusIcon className="size-7" />
          </div>
          <h2 className="text-h2">{t('empty.title')}</h2>
          <p className="text-body text-text-muted">{t('empty.text')}</p>
          <Link
            href="/me/listings/new"
            className="mt-2 inline-flex h-12 items-center rounded-lg bg-accent px-5 text-body font-semibold text-accent-contrast"
          >
            {t('empty.action')}
          </Link>
        </div>
      ) : list.isPending ? (
        <ul className="flex flex-col gap-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-30 animate-pulse rounded-lg bg-surface" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-body text-text-muted">{t(`emptyTab.${status}`)}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((listing) => (
            <Row
              key={listing.id}
              listing={listing}
              onDone={(result) => setToast(result.ok ? t(`done.${result.action}`) : t('failed'))}
            />
          ))}
        </ul>
      )}

      {list.hasNextPage ? (
        <Button
          kind="secondary"
          fullWidth
          disabled={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
        >
          {t('more')}
        </Button>
      ) : null}

      {toast ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-6 z-30 mx-auto max-w-md rounded-lg bg-text px-4 py-3 text-label text-bg shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
