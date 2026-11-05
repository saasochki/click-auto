import { getLocale, getTranslations } from 'next-intl/server';
import { CarTile, CompactTile, type ListingSummary } from '@/entities/listing/listing-tile';
import { SearchField } from '@/features/search-field/search-field';
import { listBrands } from '@/shared/api/generated/catalog/catalog';
import { searchListings } from '@/shared/api/generated/listings/listings';
import type { SearchListingsParams } from '@/shared/api/generated/model';
import { Link } from '@/shared/i18n/routing';
import { formatNumber } from '@/shared/lib/format';
import { placeParams, type Place } from '@/shared/lib/place';
import { FiltersIcon } from '@/shared/ui/icons';
import { SectionTabs } from '@/shared/ui/section-tabs';

const BRAND_CHIPS = 8;

async function load(params: SearchListingsParams, locale: string) {
  try {
    const res = await searchListings(params, {
      headers: { 'accept-language': locale },
      next: { revalidate: 60 },
    });
    return res.status === 200 ? res.data : null;
  } catch {
    // The home page still renders when search is down; the blocks are just empty.
    return null;
  }
}

function SectionTitle({ title, href, all }: { title: string; href: string; all: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-h2">{title}</h2>
      <Link href={href} className="text-label font-semibold text-accent-text">
        {all}
      </Link>
    </div>
  );
}

/** Home (design 01, D1): search, sections, popular brands, fresh cars, goods and services. */
export async function Home({ place }: { place: Place | null }) {
  const t = await getTranslations('home');
  const locale = await getLocale();
  const where = placeParams(place);
  const [cars, goods, services, brands] = await Promise.all([
    load({ type: 'car', limit: 6, facets: ['brand'], ...where }, locale),
    load({ type: 'goods', limit: 4, ...where }, locale),
    load({ type: 'service', limit: 2, ...where }, locale),
    listBrands({ next: { revalidate: 3600 } }).catch(() => null),
  ]);
  const total = (cars?.total ?? 0) + (goods?.total ?? 0) + (services?.total ?? 0);
  const brandCounts = Object.entries(cars?.facets?.brand ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, BRAND_CHIPS);
  const brandNames = new Map((brands?.data ?? []).map((brand) => [brand.slug, brand.name]));
  const mixed: ListingSummary[] = [
    ...(goods?.items.slice(0, 2) ?? []),
    ...(services?.items ?? []),
    ...(goods?.items.slice(2) ?? []),
  ].slice(0, 4);

  return (
    <div className="mx-auto flex max-w-page flex-col gap-6 px-4 pt-6 md:px-6 lg:pt-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-display">{t('title')}</h1>
        <p className="text-body text-text-muted">
          {!place || place.kind === 'all'
            ? t('countEverywhere', { count: total, formatted: formatNumber(total, locale) })
            : t('count', { count: total, formatted: formatNumber(total, locale) })}
        </p>
      </div>
      <SearchField
        type="car"
        className="lg:max-w-2xl"
        action={
          <Link
            href="/cars"
            aria-label={t('filters')}
            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-contrast hover:bg-accent-hover"
          >
            <FiltersIcon className="size-5" />
          </Link>
        }
      />
      <SectionTabs active="car" />
      {brandCounts.length ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
          {brandCounts.map(([slug]) => (
            <Link
              key={slug}
              href={`/cars/${slug}`}
              className="inline-flex h-10 shrink-0 items-center rounded-full bg-surface px-4 text-label whitespace-nowrap hover:bg-border"
            >
              {brandNames.get(slug) ?? slug}
            </Link>
          ))}
        </div>
      ) : null}

      <section className="flex flex-col gap-4">
        <SectionTitle title={t('fresh')} href="/cars" all={t('all')} />
        {cars?.items.length ? (
          <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {cars.items.map((item, index) => (
              <li key={item.id}>
                <CarTile listing={item} priority={index < 2} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-text-muted">{t('emptyCars')}</p>
        )}
      </section>

      {mixed.length ? (
        <section className="flex flex-col gap-4">
          <SectionTitle title={t('goodsAndServices')} href="/goods" all={t('all')} />
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4">
            {mixed.map((item) => (
              <li key={item.id}>
                <CompactTile listing={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
