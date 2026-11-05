import { Injectable, Logger } from '@nestjs/common';
import { newId } from '@clickauto/db';
import { PrismaService } from '../prisma.service';
import { SearchIndexer } from '../search/search-indexer';
import { nbmUrl, parseNbm, parsePrb, PRB_URL, type FetchedRate } from './rate-sources';

async function download(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.text();
}

/** Daily official rates: NBM (lei) and PRB (PMR rubles). */
@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly indexer: SearchIndexer,
  ) {}

  /**
   * Downloads both sources; a failed source is logged and skipped, its last rate stays in use.
   * Rates entered by hand for the same date are kept. Reprices the index if anything changed.
   */
  async refresh(now = new Date()): Promise<{ saved: number; failed: string[] }> {
    const failed: string[] = [];
    const fetched: FetchedRate[] = [];
    const sources: [string, () => Promise<FetchedRate[]>][] = [
      ['nbm', async () => parseNbm(await download(nbmUrl(now)))],
      ['prb', async () => parsePrb(await download(PRB_URL))],
    ];
    for (const [name, load] of sources) {
      try {
        fetched.push(...(await load()));
      } catch (error) {
        failed.push(name);
        this.logger.warn(`rates from ${name} failed: ${(error as Error).message}`);
      }
    }

    let saved = 0;
    for (const rate of fetched) {
      const date = new Date(`${rate.date}T00:00:00Z`);
      const key = { date_base_quote: { date, base: rate.base, quote: rate.quote } };
      const existing = await this.prisma.exchangeRate.findUnique({ where: key });
      if (existing?.source === 'manual') continue;
      if (existing && existing.rate.toString() === Number(rate.rate).toString()) continue;
      await this.prisma.exchangeRate.upsert({
        where: key,
        create: {
          id: newId(),
          date,
          base: rate.base,
          quote: rate.quote,
          rate: rate.rate,
          source: rate.source,
        },
        update: { rate: rate.rate, source: rate.source },
      });
      saved += 1;
    }
    if (saved > 0) await this.indexer.repriceAll();
    this.logger.log(`rates refreshed: ${saved} saved, failed: ${failed.join(', ') || 'none'}`);
    return { saved, failed };
  }
}
