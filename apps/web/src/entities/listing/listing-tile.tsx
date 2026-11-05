import { cn } from '@clickauto/ui';
import { useLocale, useTranslations } from 'next-intl';
import type { SearchResultDtoItemsItem } from '@/shared/api/generated/model';
import { Link } from '@/shared/i18n/routing';
import { formatRelativeDay } from '@/shared/lib/format';
import { ImageIcon } from '@/shared/ui/icons';
import { listingHref } from './listing-href';
import { ListingPrice, useListingSubtitle } from './listing-meta';
import { SOURCE_NAMES } from './source';

export type ListingSummary = SearchResultDtoItemsItem;

/** Feed photo from imgproxy; the first rows load eagerly for a fast first paint. */
function TilePhoto({
  listing,
  priority,
  className,
}: {
  listing: ListingSummary;
  priority?: boolean;
  className?: string;
}) {
  if (!listing.photo) {
    return (
      <div className={cn('flex items-center justify-center bg-surface text-text-muted', className)}>
        <ImageIcon className="size-8" />
      </div>
    );
  }
  return (
    <img
      src={listing.photo.url}
      alt={listing.title}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={cn('bg-surface object-cover', className)}
    />
  );
}

function SourceBadge({ code }: { code: string | null }) {
  const t = useTranslations('feed');
  if (!code) return null;
  return (
    <span className="absolute top-3 left-3 rounded-full bg-overlay/70 px-3 py-1 text-caption text-white">
      {t('source', { name: SOURCE_NAMES[code] ?? code })}
    </span>
  );
}

function When({ iso }: { iso: string }) {
  const locale = useLocale();
  return (
    <span suppressHydrationWarning className="shrink-0 text-caption text-text-muted">
      {formatRelativeDay(iso, locale)}
    </span>
  );
}

/** Large card of the car feed: photo, price, date, title, "2.5 AT · 98 000 км · Тирасполь". */
export function CarTile({ listing, priority }: { listing: ListingSummary; priority?: boolean }) {
  const subtitle = useListingSubtitle();
  return (
    <Link href={listingHref(listing)} className="group flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-xl">
        <TilePhoto
          listing={listing}
          priority={priority}
          className="aspect-4/3 w-full transition-transform group-hover:scale-105"
        />
        <SourceBadge code={listing.sourceCode} />
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <ListingPrice listing={listing} className="text-h1 font-bold" />
        <When iso={listing.publishedAt} />
      </div>
      <div className="flex flex-col">
        <span className="line-clamp-1 text-body font-semibold">{listing.title}</span>
        <span className="line-clamp-1 text-caption text-text-muted">{subtitle(listing)}</span>
      </div>
    </Link>
  );
}

/** Compact tile for the 2-column goods grid and the home "Товары и услуги" block. */
export function CompactTile({
  listing,
  priority,
}: {
  listing: ListingSummary;
  priority?: boolean;
}) {
  const t = useTranslations('feed');
  const locale = useLocale();
  const service = listing.service;
  return (
    <Link href={listingHref(listing)} className="group flex min-w-0 flex-col gap-1.5">
      <div className="relative overflow-hidden rounded-lg">
        <TilePhoto listing={listing} priority={priority} className="aspect-square w-full" />
      </div>
      <span className="text-h3 font-bold">
        {service && listing.price ? `${t('from')} ` : null}
        <ListingPrice listing={listing} />
      </span>
      <span className="line-clamp-2 text-label">{listing.title}</span>
      <span suppressHydrationWarning className="line-clamp-1 text-caption text-text-muted">
        {[listing.city.name, formatRelativeDay(listing.publishedAt, locale)].join(' · ')}
      </span>
    </Link>
  );
}

/** Row of the services list: photo on the left, category, title, "от 300 руб.", city and hours. */
export function ServiceRow({ listing, priority }: { listing: ListingSummary; priority?: boolean }) {
  const t = useTranslations('feed');
  const service = listing.service;
  return (
    <Link
      href={listingHref(listing)}
      className="flex gap-3 rounded-lg bg-surface p-3 hover:bg-border"
    >
      <TilePhoto listing={listing} priority={priority} className="size-24 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-col gap-1">
        {service ? (
          <span className="text-caption text-text-muted">{service.category.name}</span>
        ) : null}
        <span className="line-clamp-2 text-body font-semibold">{listing.title}</span>
        <span className="text-h3 font-bold">
          {listing.price ? `${t('from')} ` : null}
          <ListingPrice listing={listing} />
        </span>
        <span className="line-clamp-1 text-caption text-text-muted">
          {[listing.city.name, service?.workingHours].filter(Boolean).join(' · ')}
        </span>
        {service?.mobileService ? (
          <span className="self-start rounded-full bg-accent-subtle px-2 py-0.5 text-caption text-accent-text">
            {t('mobileService')}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

/** Skeleton rows while the feed loads (design 34). */
export function TileSkeleton({ variant }: { variant: 'car' | 'compact' | 'row' }) {
  if (variant === 'row') return <div className="h-32 animate-pulse rounded-lg bg-surface" />;
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          'animate-pulse bg-surface',
          variant === 'car' ? 'aspect-4/3 rounded-xl' : 'aspect-square rounded-lg',
        )}
      />
      <div className="h-6 w-1/2 animate-pulse rounded-sm bg-surface" />
      <div className="h-4 w-3/4 animate-pulse rounded-sm bg-surface" />
    </div>
  );
}
