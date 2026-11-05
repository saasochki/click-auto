import type { ListingType } from '@clickauto/shared';
import { cache } from 'react';
import { listingHref, listingIdFromSegment } from '@/entities/listing/listing-href';
import { getListing } from '@/shared/api/generated/listings/listings';
import type { ListingDto } from '@/shared/api/generated/model';
import { ApiError } from '@/shared/api/http-client';

export type LoadedListing =
  | { kind: 'ok'; listing: ListingDto; canonical: string }
  | { kind: 'gone' }
  | { kind: 'missing' };

/**
 * Public card on the server. Cached for a minute and tagged `listing:<id>` (frontend
 * architecture, "Данные"). Deduplicated between generateMetadata and the page.
 */
export const loadListing = cache(
  async (segment: string, locale: string): Promise<LoadedListing> => {
    const id = listingIdFromSegment(segment);
    if (!id) return { kind: 'missing' };
    try {
      const res = await getListing(id, {
        headers: { 'accept-language': locale },
        next: { revalidate: 60, tags: [`listing:${id}`] },
      });
      if (res.status !== 200) return { kind: 'missing' };
      return { kind: 'ok', listing: res.data, canonical: listingHref(res.data) };
    } catch (error) {
      if (error instanceof ApiError && error.problem.status === 410) return { kind: 'gone' };
      if (error instanceof ApiError && error.problem.status < 500) return { kind: 'missing' };
      throw error;
    }
  },
);

export function sectionMatches(listing: ListingDto, type: ListingType): boolean {
  return listing.type === type;
}
