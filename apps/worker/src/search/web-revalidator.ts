import { Inject, Injectable, Logger } from '@nestjs/common';
import { ENV } from '../tokens';
import type { Env } from '../env';

/** Drops cached site pages by tag (listing:<id>) after a listing changes. Best effort. */
@Injectable()
export class WebRevalidator {
  private readonly logger = new Logger(WebRevalidator.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  async revalidate(tags: string[]): Promise<void> {
    if (!this.env.REVALIDATE_SECRET || tags.length === 0) return;
    try {
      const response = await fetch(new URL('/api/revalidate', this.env.WEB_URL), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-revalidate-secret': this.env.REVALIDATE_SECRET,
        },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) this.logger.warn(`revalidate answered ${response.status}`);
    } catch (error) {
      this.logger.warn(`revalidate failed: ${(error as Error).message}`);
    }
  }
}
