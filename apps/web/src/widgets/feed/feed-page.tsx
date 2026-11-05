import type { ListingType } from '@clickauto/shared';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';
import { feedQueryOptions } from '@/entities/feed/feed-query';
import {
  FEED_PAGE_SIZE,
  FEED_PATH,
  filterConfigParams,
  readFeedFilters,
  toSearchParams,
  type RawSearchParams,
} from '@/entities/feed/filters';
import {
  getGetFilterConfigQueryOptions,
  listBrands,
  listCategories,
  listModels,
} from '@/shared/api/generated/catalog/catalog';
import { getQueryClient } from '@/shared/api/query-client';
import type { Place } from '@/shared/lib/place';
import { Feed, type Crumb } from './feed';

/** Path parts of landing pages: /cars/toyota/camry, /goods/tires. */
export interface FeedPath {
  brand?: string;
  model?: string;
  category?: string;
}

const CATALOG_CACHE = { next: { revalidate: 3600 } } as const;

/** Names behind the path slugs; null when a slug does not exist (404). */
const resolvePath = cache(async (type: ListingType, path: FeedPath, locale: string) => {
  const init = { ...CATALOG_CACHE, headers: { 'accept-language': locale } };
  if (type === 'car' && path.brand) {
    const brands = await listBrands(init);
    const brand = brands.data.find((b) => b.slug === path.brand);
    if (!brand) return null;
    if (!path.model) return { brand, model: null, category: null };
    const models = await listModels(brand.id, init);
    const model = models.status === 200 ? models.data.find((m) => m.slug === path.model) : null;
    return model ? { brand, model, category: null } : null;
  }
  if (type !== 'car' && path.category) {
    const categories = await listCategories({ kind: type }, init);
    const category =
      categories.status === 200 ? categories.data.find((c) => c.slug === path.category) : null;
    return category ? { brand: null, model: null, category } : null;
  }
  return { brand: null, model: null, category: null };
});

const SECTION_KEY = { car: 'cars', goods: 'goods', service: 'services' } as const;

async function heading(type: ListingType, path: FeedPath, locale: string) {
  const t = await getTranslations({ locale, namespace: 'feed' });
  const resolved = await resolvePath(type, path, locale);
  if (!resolved) notFound();
  const section = t(`section.${SECTION_KEY[type]}`);
  const crumbs: Crumb[] = [
    { label: t('home'), href: '/' },
    { label: section, href: FEED_PATH[type] },
  ];
  let title = section;
  if (resolved.brand) {
    crumbs.push({ label: resolved.brand.name, href: `/cars/${resolved.brand.slug}` });
    title = resolved.brand.name;
    if (resolved.model) {
      crumbs.push({ label: resolved.model.name });
      title = `${resolved.brand.name} ${resolved.model.name}`;
    }
  }
  if (resolved.category) {
    crumbs.push({ label: resolved.category.name });
    title = resolved.category.name;
  }
  return { title, crumbs };
}

export async function feedMetadata(
  type: ListingType,
  path: FeedPath,
  locale: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'feed' });
  const { title } = await heading(type, path, locale);
  const route = [FEED_PATH[type], path.brand, path.model, path.category].filter(Boolean).join('/');
  return {
    title: t('metaTitle', { title }),
    description: t(`metaDescription.${SECTION_KEY[type]}`, { title }),
    // Filtered variants of a feed point to the clean landing URL.
    alternates: {
      canonical: `/${locale}${route}`,
      languages: { ru: `/ru${route}`, ro: `/ro${route}` },
    },
  };
}

/** Server part of a feed: filters from the URL and the path, place from the cookie, first page. */
export async function FeedPage({
  type,
  locale,
  path = {},
  searchParams,
  place,
}: {
  type: ListingType;
  locale: string;
  path?: FeedPath;
  searchParams: RawSearchParams;
  place: Place | null;
}) {
  const { title, crumbs } = await heading(type, path, locale);
  const filters = readFeedFilters(searchParams, {
    car: path.brand ? [path.brand, path.model].filter(Boolean).join(':') : undefined,
    category: path.category,
  });
  const params = { ...toSearchParams(type, filters, place), limit: FEED_PAGE_SIZE };

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchInfiniteQuery(
      feedQueryOptions(params, {
        headers: { 'accept-language': locale },
        next: { revalidate: 30 },
      }),
    ),
    // The panel is built from the filter config: without it the sidebar would appear late.
    queryClient.prefetchQuery(
      getGetFilterConfigQueryOptions(filterConfigParams(type, filters), {
        request: { headers: { 'accept-language': locale }, next: { revalidate: 300 } },
      }),
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Feed
        type={type}
        filters={filters}
        place={place}
        params={params}
        title={title}
        crumbs={crumbs}
      />
    </HydrationBoundary>
  );
}
