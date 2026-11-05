import { z } from 'zod';

/** Environment variables of the API. Every new variable goes to .env.example with a comment. */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  /** Comma-separated list of allowed origins (site and admin) for CORS and the Origin check. */
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
  PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  /** Site URL: redirects after Google sign-in, links in emails. */
  WEB_URL: z.string().url().default('http://localhost:3000'),
  /** Parent domain for the session cookie in production, e.g. ".example.md". Empty — host-only. */
  COOKIE_DOMAIN: z.string().optional(),
  /** Secret mixed into one-time code hashes. */
  OTP_PEPPER: z.string().min(16).default('local-dev-otp-pepper-change-me'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  MAIL_FROM: z.string().default('ClickAuto <no-reply@localhost>'),
  /** S3-compatible storage (RustFS locally and on the VPS). */
  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  /** S3 host as the browser sees it, for presigned upload URLs. Defaults to S3_ENDPOINT. */
  S3_PUBLIC_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('clickauto'),
  S3_ACCESS_KEY: z.string().default('clickauto'),
  S3_SECRET_KEY: z.string().default('clickauto-local'),
  /** imgproxy base URL; key and salt (hex) sign URLs in production. */
  IMGPROXY_URL: z.string().url().default('http://localhost:8080'),
  IMGPROXY_KEY: z.string().optional(),
  IMGPROXY_SALT: z.string().optional(),
  /** Meilisearch: the listings index. On servers a search-only key is enough for the API. */
  MEILI_URL: z.string().url().default('http://localhost:7700'),
  MEILI_KEY: z.string().optional(),
  /** Index name; tests use their own. */
  MEILI_INDEX: z.string().default('listings'),
  /** Google OAuth client. Without them the Google sign-in endpoints answer 503. */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${fields}`);
  }
  if (parsed.data.NODE_ENV === 'production' && parsed.data.OTP_PEPPER.startsWith('local-dev')) {
    throw new Error('OTP_PEPPER must be set in production');
  }
  return parsed.data;
}
