import type { ListingType } from '@clickauto/shared';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { RawSearchParams } from '@/entities/feed/filters';
import { readPlace } from '@/shared/lib/place-server';
import { BottomNav } from '@/widgets/bottom-nav/bottom-nav';
import { FeedPage, feedMetadata, type FeedPath } from '@/widgets/feed/feed-page';
import { SiteFooter } from '@/widgets/site-footer/site-footer';
import { SiteHeader } from '@/widgets/site-header/site-header';

type RouteParams = { locale: string; brand?: string; model?: string; category?: string };
type Props = {
  params: Promise<RouteParams>;
  searchParams: Promise<RawSearchParams>;
};

function pathOf(params: RouteParams): FeedPath {
  return { brand: params.brand, model: params.model, category: params.category };
}

/**
 * Feed route: /cars, /cars/[brand], /cars/[brand]/[model], /goods[/category],
 * /services[/category]. The page shell (header, footer, tab bar) is composed here.
 */
export function feedRoute(type: ListingType) {
  async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolved = await params;
    return feedMetadata(type, pathOf(resolved), resolved.locale);
  }

  async function Page({ params, searchParams }: Props) {
    const resolved = await params;
    setRequestLocale(resolved.locale);
    const place = await readPlace();
    return (
      <>
        <SiteHeader section={type} place={place} mobile={type === 'car' ? 'none' : 'brand'} />
        <main>
          <FeedPage
            type={type}
            locale={resolved.locale}
            path={pathOf(resolved)}
            searchParams={await searchParams}
            place={place}
          />
        </main>
        <SiteFooter />
        <BottomNav />
      </>
    );
  }

  return { generateMetadata, Page };
}
