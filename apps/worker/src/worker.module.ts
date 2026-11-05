import { Module, type Provider } from '@nestjs/common';
import { createMeiliClient } from '@clickauto/search';
import { loadEnv, type Env } from './env';
import { JobsService } from './jobs.service';
import { PrismaService } from './prisma.service';
import { RatesService } from './rates/rates.service';
import { SearchIndexer } from './search/search-indexer';
import { WebRevalidator } from './search/web-revalidator';
import { ENV, MEILI } from './tokens';

/** Services shared by the long-running worker and one-off commands. */
export const coreProviders: Provider[] = [
  { provide: ENV, useFactory: (): Env => loadEnv() },
  {
    provide: MEILI,
    inject: [ENV],
    useFactory: (env: Env) => createMeiliClient({ url: env.MEILI_URL, key: env.MEILI_KEY }),
  },
  PrismaService,
  WebRevalidator,
  SearchIndexer,
  RatesService,
];

/** Background jobs: outbox → search index, exchange rates. Import and emails come later. */
@Module({ providers: [...coreProviders, JobsService] })
export class WorkerModule {}

/** One-off commands: no job loop. */
@Module({ providers: coreProviders })
export class CommandModule {}
