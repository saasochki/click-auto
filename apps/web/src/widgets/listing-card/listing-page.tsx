import { MINOR_UNITS, type ListingType } from '@clickauto/shared';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getPathname } from '@/shared/i18n/routing';
import { ListingCard, ListingGone } from './listing-card';
import { loadListing } from './load-listing';

type Props = { params: Promise<{ locale: string; slug: string }> };

/** Page and metadata of a public card, shared by /cars, /goods and /services. */
export function listingPage(type: ListingType) {
  async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, slug } = await params;
    const loaded = await loadListing(slug, locale);
    // Hidden and removed listings are not indexed.
    if (loaded.kind !== 'ok') return { robots: { index: false } };
    const { listing, canonical } = loaded;
    const image = listing.photos[0]?.url;
    return {
      title: `${listing.title} — ClickAuto`,
      description: listing.description.slice(0, 160) || listing.title,
      alternates: {
        canonical: `/${locale}${canonical}`,
        languages: { ru: `/ru${canonical}`, ro: `/ro${canonical}` },
      },
      openGraph: { title: listing.title, images: image ? [image] : undefined },
    };
  }

  async function Page({ params }: Props) {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    const loaded = await loadListing(slug, locale);
    if (loaded.kind === 'missing') notFound();
    if (loaded.kind === 'gone') return <ListingGone />;
    const { listing, canonical } = loaded;
    // Wrong section or an outdated slug: one canonical URL per listing.
    if (listing.type !== type || !canonical.endsWith(`/item/${slug}`)) {
      permanentRedirect(getPathname({ href: canonical, locale }));
    }
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': listing.type === 'car' ? 'Car' : listing.type === 'service' ? 'Service' : 'Product',
      name: listing.title,
      description: listing.description || undefined,
      image: listing.photos.map((photo) => photo.url),
      // The PMR ruble has no ISO 4217 code, so such prices go without an Offer.
      offers:
        listing.price && listing.price.currency !== 'PRB'
          ? {
              '@type': 'Offer',
              price: listing.price.amount / MINOR_UNITS[listing.price.currency],
              priceCurrency: listing.price.currency,
            }
          : undefined,
    };
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <ListingCard listing={listing} />
      </>
    );
  }

  return { generateMetadata, Page };
}
