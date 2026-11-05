'use client';

import { LISTING_TYPES, type ListingType } from '@clickauto/shared';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ListingForm } from '@/features/listing-form/listing-form';
import { Published } from '@/features/listing-form/published';
import { useGetMyListing } from '@/shared/api/generated/me/me';
import type { ListingDto } from '@/shared/api/generated/model';
import { Link } from '@/shared/i18n/routing';

/** /me/listings/new: the type picker until ?type= names a listing type. */
export function NewListingByType({ picker }: { picker: ReactNode }) {
  const type = useSearchParams().get('type');
  if (type && (LISTING_TYPES as readonly string[]).includes(type)) {
    return <NewListing key={type} type={type as ListingType} />;
  }
  return <>{picker}</>;
}

/** New listing: form, then the "Опубликовано" screen. */
export function NewListing({ type }: { type: ListingType }) {
  const [published, setPublished] = useState<ListingDto | null>(null);
  if (published) return <Published listing={published} />;
  return <ListingForm type={type} onPublished={setPublished} />;
}

/** Editing an own listing in any editable status. */
export function EditListing({ id }: { id: string }) {
  const t = useTranslations('listingForm');
  const query = useGetMyListing(id, { query: { retry: false } });
  const [published, setPublished] = useState<ListingDto | null>(null);

  if (published) return <Published listing={published} />;
  if (query.isPending) return <div className="min-h-dvh" aria-busy />;
  const listing = query.data?.status === 200 ? query.data.data : null;
  const editable =
    listing &&
    (listing.status === 'draft' || listing.status === 'active' || listing.status === 'hidden');
  if (!listing || !editable) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-h2">{t(listing ? 'notEditable' : 'notFound')}</h1>
        <Link href="/me/listings" className="text-body font-semibold text-accent-text">
          {t('published.toMyListings')}
        </Link>
      </main>
    );
  }
  // key: a fresh form after a refetch with a new version.
  return (
    <ListingForm
      key={listing.version}
      type={listing.type}
      listing={listing}
      onPublished={setPublished}
    />
  );
}
