import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { Locale } from '@clickauto/shared';
import type Redis from 'ioredis';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AppError } from '../../common/problem';
import { ENV } from '../../config/config.module';
import type { Env } from '../../config/env';
import { REDIS } from '../../infra/redis.module';
import type { GoogleClaims } from './auth.service';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const STATE_TTL_SECONDS = 600;

interface PendingAuth {
  verifier: string;
  locale: Locale;
}

/** Google OpenID Connect: Authorization Code + PKCE. */
@Injectable()
export class GoogleService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  get enabled(): boolean {
    return Boolean(this.env.GOOGLE_CLIENT_ID && this.env.GOOGLE_CLIENT_SECRET);
  }

  private get redirectUri(): string {
    return `${this.env.PUBLIC_API_URL}/api/v1/auth/google/callback`;
  }

  /** Returns the Google URL and the state that must also be bound to the browser cookie. */
  async start(locale: Locale): Promise<{ url: string; state: string }> {
    if (!this.enabled) throw new AppError(503, 'google_disabled');
    const state = randomBytes(24).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const pending: PendingAuth = { verifier, locale };
    await this.redis.set(`oauth:google:${state}`, JSON.stringify(pending), 'EX', STATE_TTL_SECONDS);

    const params = new URLSearchParams({
      client_id: this.env.GOOGLE_CLIENT_ID ?? '',
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
    return { url: `${AUTH_URL}?${params.toString()}`, state };
  }

  async finish(code: string, state: string): Promise<{ claims: GoogleClaims; locale: Locale }> {
    if (!this.enabled) throw new AppError(503, 'google_disabled');
    const key = `oauth:google:${state}`;
    const raw = await this.redis.get(key);
    if (!raw) throw new AppError(400, 'oauth_state_invalid');
    await this.redis.del(key);
    const pending = JSON.parse(raw) as PendingAuth;

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: this.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: pending.verifier,
      }),
    });
    if (!response.ok) throw new AppError(400, 'oauth_exchange_failed');
    const tokens = (await response.json()) as { id_token?: string };
    if (!tokens.id_token) throw new AppError(400, 'oauth_exchange_failed');

    const { payload } = await jwtVerify(tokens.id_token, JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: this.env.GOOGLE_CLIENT_ID,
    });
    if (typeof payload.email !== 'string' || payload.email_verified !== true || !payload.sub) {
      throw new AppError(400, 'oauth_email_unverified');
    }
    return {
      claims: {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        name: typeof payload.name === 'string' ? payload.name.slice(0, 100) : null,
      },
      locale: pending.locale,
    };
  }
}
