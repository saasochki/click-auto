import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ensureListingsIndex, type MeiliSearch } from '@clickauto/search';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import type { Env } from './env';
import { PrismaService } from './prisma.service';
import { RatesService } from './rates/rates.service';
import { SearchIndexer } from './search/search-indexer';
import { ENV, MEILI } from './tokens';

/** BullMQ queues. The admin will enqueue "rates/refresh" and "search/reindex" by hand. */
export const QUEUES = { rates: 'rates', search: 'search' } as const;

/**
 * Background work: the outbox loop (search index), the daily exchange rates job
 * and on-demand reindexing.
 */
@Injectable()
export class JobsService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(JobsService.name);
  private readonly connection: IORedis;
  private readonly workers: Worker[] = [];
  private readonly queues: Queue[] = [];
  private stopped = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(MEILI) private readonly meili: MeiliSearch,
    private readonly prisma: PrismaService,
    private readonly indexer: SearchIndexer,
    private readonly rates: RatesService,
  ) {
    this.connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  }

  async onApplicationBootstrap(): Promise<void> {
    await ensureListingsIndex(this.meili, this.env.MEILI_INDEX);

    const ratesQueue = new Queue(QUEUES.rates, { connection: this.connection });
    const searchQueue = new Queue(QUEUES.search, { connection: this.connection });
    this.queues.push(ratesQueue, searchQueue);
    await ratesQueue.upsertJobScheduler(
      'daily',
      { pattern: this.env.RATES_CRON, tz: 'Europe/Chisinau' },
      { name: 'refresh', opts: { attempts: 3, backoff: { type: 'exponential', delay: 60_000 } } },
    );

    this.workers.push(
      new Worker(QUEUES.rates, async () => this.rates.refresh(), { connection: this.connection }),
      new Worker(
        QUEUES.search,
        async (job) => {
          if (job.name === 'reindex') return this.indexer.reindexAll();
          if (job.name === 'reprice') return this.indexer.repriceAll();
          return null;
        },
        { connection: this.connection },
      ),
    );
    for (const worker of this.workers) {
      worker.on('failed', (job, error) =>
        this.logger.error(`${job?.queueName}/${job?.name} failed: ${error.message}`),
      );
    }

    // The price filter needs rates from the very first start.
    if ((await this.prisma.exchangeRate.count()) === 0) {
      await ratesQueue.add('refresh', {}, { jobId: 'initial-refresh' });
    }

    this.loop();
    this.logger.log('jobs started');
  }

  /** Polls the outbox; drains it without a pause while there is work. */
  private loop(): void {
    if (this.stopped) return;
    void this.indexer
      .processOutbox()
      .catch((error: Error) => {
        this.logger.error(`outbox: ${error.message}`);
        return 0;
      })
      .then((handled) => {
        if (this.stopped) return;
        this.timer = setTimeout(() => this.loop(), handled > 0 ? 0 : this.env.OUTBOX_POLL_MS);
      });
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    await Promise.all(this.workers.map((worker) => worker.close()));
    await Promise.all(this.queues.map((queue) => queue.close()));
    await this.connection.quit();
  }
}
