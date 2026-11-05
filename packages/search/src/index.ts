import { MeiliSearch, type Index } from 'meilisearch';
import { LISTINGS_INDEX, LISTINGS_INDEX_SETTINGS, type ListingDocument } from './document';

export * from './build';
export * from './document';
export * from './rates';
export { MeiliSearch };

export interface MeiliConfig {
  url: string;
  /** Master key locally; a search or admin API key on servers. */
  key?: string;
}

export function createMeiliClient(config: MeiliConfig): MeiliSearch {
  return new MeiliSearch({ host: config.url, apiKey: config.key || undefined });
}

/** The index name can be overridden (MEILI_INDEX) so tests do not touch the local index. */
export function listingsIndex(client: MeiliSearch, name = LISTINGS_INDEX): Index<ListingDocument> {
  return client.index<ListingDocument>(name);
}

/** Creates the index if needed and applies settings. Safe to call on every start. */
export async function ensureListingsIndex(
  client: MeiliSearch,
  name = LISTINGS_INDEX,
): Promise<void> {
  try {
    await client.getIndex(name);
  } catch {
    await client.createIndex(name, { primaryKey: 'id' }).waitTask();
  }
  await listingsIndex(client, name).updateSettings(LISTINGS_INDEX_SETTINGS).waitTask();
}
