import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ensureListingsIndex, type MeiliSearch } from '@clickauto/search';
import { RatesService } from './rates/rates.service';
import { SearchIndexer } from './search/search-indexer';
import type { Env } from './env';
import { ENV, MEILI } from './tokens';
import { CommandModule } from './worker.module';

/**
 * One-off commands:
 *   search:reindex — rebuild the whole index from PostgreSQL;
 *   rates:refresh  — download exchange rates now.
 */
async function main(): Promise<void> {
  const command = process.argv[2];
  const app = await NestFactory.createApplicationContext(CommandModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    if (command === 'search:reindex') {
      await ensureListingsIndex(app.get<MeiliSearch>(MEILI), app.get<Env>(ENV).MEILI_INDEX);
      await app.get(SearchIndexer).reindexAll();
    } else if (command === 'rates:refresh') {
      await app.get(RatesService).refresh();
    } else {
      throw new Error(`unknown command: ${command ?? '(none)'}`);
    }
  } finally {
    await app.close();
  }
}

main().catch((error: Error) => {
  new Logger('Command').error(error.message);
  process.exit(1);
});
