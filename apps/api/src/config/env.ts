import { z } from 'zod';

/** Environment variables of the API. Every new variable goes to .env.example with a comment. */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  /** Comma-separated list of allowed origins (site and admin) for CORS and the Origin check. */
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
  PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
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
