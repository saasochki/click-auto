import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  buildListingDocuments,
  latestUsdRates,
  listingsIndex,
  type MeiliSearch,
} from '@clickauto/search';
import { toUsdMinor } from '@clickauto/shared';
import { PrismaService } from '../prisma.service';
import type { Env } from '../env';
import { ENV, MEILI } from '../tokens';
import { WebRevalidator } from './web-revalidator';

/** Events are retried this many times, then left for investigation. */
const MAX_ATTEMPTS = 10;
const OUTBOX_BATCH = 100;
const REINDEX_BATCH = 500;

interface OutboxRow {
  id: string;
  payload: unknown;
}

/** Keeps the Meilisearch index in sync with PostgreSQL. */
@Injectable()
export class SearchIndexer {
  private readonly logger = new Logger(SearchIndexer.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEILI) private readonly meili: MeiliSearch,
    @Inject(ENV) private readonly env: Env,
    private readonly revalidator: WebRevalidator,
  ) {}

  /**
   * Takes a batch of unprocessed outbox events (rows locked, so parallel workers skip them),
   * upserts or removes the listings in the index and marks the events processed.
   * Returns the number of handled events.
   */
  async processOutbox(): Promise<number> {
    let listingIds: string[] = [];
    const handled = await this.prisma.$transaction(
      async (tx) => {
        const rows = await tx.$queryRaw<OutboxRow[]>`
          SELECT id, payload FROM outbox_events
          WHERE processed_at IS NULL AND attempts < ${MAX_ATTEMPTS}
          ORDER BY created_at
          LIMIT ${OUTBOX_BATCH}
          FOR UPDATE SKIP LOCKED`;
        if (rows.length === 0) return 0;
        const ids = rows.map((row) => row.id);
        listingIds = rows.flatMap((row) => {
          const id = (row.payload as { listingId?: unknown } | null)?.listingId;
          return typeof id === 'string' ? [id] : [];
        });
        try {
          await this.sync(listingIds);
          await tx.outboxEvent.updateMany({
            where: { id: { in: ids } },
            data: { processedAt: new Date(), attempts: { increment: 1 } },
          });
        } catch (error) {
          this.logger.error(`outbox batch failed: ${(error as Error).message}`);
          await tx.outboxEvent.updateMany({
            where: { id: { in: ids } },
            data: { attempts: { increment: 1 } },
          });
          listingIds = [];
        }
        return rows.length;
      },
      { timeout: 60_000 },
    );
    if (listingIds.length) {
      await this.revalidator.revalidate([...new Set(listingIds)].map((id) => `listing:${id}`));
    }
    return handled;
  }

  /** Rebuilds documents of the given listings: active ones are upserted, others removed. */
  async sync(listingIds: string[]): Promise<void> {
    if (listingIds.length === 0) return;
    const rates = await latestUsdRates(this.prisma);
    const { documents, removeIds } = await buildListingDocuments(this.prisma, listingIds, rates);
    const index = listingsIndex(this.meili, this.env.MEILI_INDEX);
    if (documents.length) await index.addDocuments(documents).waitTask();
    if (removeIds.length) await index.deleteDocuments(removeIds).waitTask();
  }

  /** Full rebuild: every active listing is reindexed, everything else is dropped. */
  async reindexAll(): Promise<number> {
    const index = listingsIndex(this.meili, this.env.MEILI_INDEX);
    await index.deleteAllDocuments().waitTask();
    let cursor: string | undefined;
    let total = 0;
    for (;;) {
      const rows = await this.prisma.listing.findMany({
        where: { status: 'active', ...(cursor ? { id: { gt: cursor } } : {}) },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: REINDEX_BATCH,
      });
      if (rows.length === 0) break;
      await this.sync(rows.map((row) => row.id));
      total += rows.length;
      cursor = rows.at(-1)?.id;
    }
    this.logger.log(`reindexed ${total} listings`);
    return total;
  }

  /** After new exchange rates: recompute priceUsd of every priced active listing. */
  async repriceAll(): Promise<number> {
    const rates = await latestUsdRates(this.prisma);
    if (!rates) return 0;
    const index = listingsIndex(this.meili, this.env.MEILI_INDEX);
    let cursor: string | undefined;
    let total = 0;
    for (;;) {
      const rows = await this.prisma.listing.findMany({
        where: {
          status: 'active',
          priceAmount: { not: null },
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        select: { id: true, priceAmount: true, priceCurrency: true },
        orderBy: { id: 'asc' },
        take: REINDEX_BATCH,
      });
      if (rows.length === 0) break;
      const updates = rows.flatMap((row) =>
        row.priceAmount !== null && row.priceCurrency
          ? [{ id: row.id, priceUsd: toUsdMinor(row.priceAmount, row.priceCurrency, rates) }]
          : [],
      );
      await index.updateDocuments(updates).waitTask();
      total += rows.length;
      cursor = rows.at(-1)?.id;
    }
    this.logger.log(`repriced ${total} listings`);
    return total;
  }
}
