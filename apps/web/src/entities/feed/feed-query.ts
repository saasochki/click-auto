import { infiniteQueryOptions } from '@tanstack/react-query';
import {
  getSearchListingsQueryKey,
  searchListings,
} from '@/shared/api/generated/listings/listings';
import type { SearchListingsParams } from '@/shared/api/generated/model';

/**
 * Infinite feed query, shared by the server prefetch and the client list so the hydrated
 * cache is picked up without a second request. The cursor is passed page by page.
 */
export function feedQueryOptions(params: SearchListingsParams, init?: RequestInit) {
  return infiniteQueryOptions({
    queryKey: getSearchListingsQueryKey(params),
    queryFn: ({ pageParam, signal }) =>
      searchListings({ ...params, cursor: pageParam }, { ...init, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.status === 200 ? (last.data.nextCursor ?? undefined) : undefined,
  });
}
