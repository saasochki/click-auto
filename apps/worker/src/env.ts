import { z } from 'zod';

/** Environment variables of the worker. Every new variable goes to .env.example with a comment. */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  MEILI_URL: z.string().url().default('http://localhost:7700'),
  MEILI_KEY: z.string().optional(),
  /** Index name; tests use their own. */
  MEILI_INDEX: z.string().default('listings'),
  /** Site URL for cache revalidation after a listing changes. */
  WEB_URL: z.string().url().default('http://localhost:3000'),
  /** Shared secret of the site's /api/revalidate. Empty — revalidation is skipped. */
  REVALIDATE_SECRET: z.string().optional(),
  /** Daily exchange rates download, cron in the Europe/Chisinau time zone. */
  RATES_CRON: z.string().default('15 10 * * *'),
  /** Outbox polling interval in milliseconds. */
  OUTBOX_POLL_MS: z.coerce.number().int().min(100).default(1000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${fields}`);
  }
  return parsed.data;
}
