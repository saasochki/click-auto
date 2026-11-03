import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS } from '@clickauto/shared';
import type Redis from 'ioredis';
import { AppError } from '../../common/problem';
import { ENV } from '../../config/config.module';
import type { Env } from '../../config/env';
import { REDIS } from '../../infra/redis.module';

/** Pause before the same email can request a new code (matches the timer on the code screen). */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
/** Codes one IP may request per hour, against mass mailing. */
export const OTP_IP_LIMIT_PER_HOUR = 20;

export type OtpCheck =
  | { result: 'ok' }
  | { result: 'invalid'; attemptsLeft: number }
  | { result: 'expired' }
  | { result: 'too_many_attempts' };

interface StoredOtp {
  hash: string;
  attempts: number;
}

/**
 * One-time sign-in codes in Redis. Keys contain a hash of the email, never the email itself.
 * Docs: docs/backend/02-architecture.md#вход-по-email-коду.
 */
@Injectable()
export class OtpService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private key(kind: string, email: string): string {
    return `otp:${kind}:${createHash('sha256').update(email).digest('hex')}`;
  }

  private hashCode(email: string, code: string): string {
    return createHash('sha256').update(`${this.env.OTP_PEPPER}:${email}:${code}`).digest('hex');
  }

  /** Creates a new code. Throws 429 with Retry-After when limits are hit. */
  async issue(email: string, ip: string): Promise<string> {
    const cooldownKey = this.key('cooldown', email);
    const cooldownTtl = await this.redis.ttl(cooldownKey);
    if (cooldownTtl > 0) {
      throw new AppError(429, 'otp_resend_too_soon', undefined, {
        'Retry-After': String(cooldownTtl),
      });
    }
    const ipKey = `otp:ip:${createHash('sha256').update(ip).digest('hex')}`;
    const ipCount = await this.redis.incr(ipKey);
    if (ipCount === 1) await this.redis.expire(ipKey, 3600);
    if (ipCount > OTP_IP_LIMIT_PER_HOUR) {
      const ttl = await this.redis.ttl(ipKey);
      throw new AppError(429, 'rate_limited', undefined, {
        'Retry-After': String(Math.max(ttl, 1)),
      });
    }

    const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
    const stored: StoredOtp = { hash: this.hashCode(email, code), attempts: 0 };
    await this.redis
      .multi()
      .set(this.key('code', email), JSON.stringify(stored), 'EX', OTP_TTL_SECONDS)
      .set(cooldownKey, '1', 'EX', OTP_RESEND_COOLDOWN_SECONDS)
      .exec();
    return code;
  }

  async check(email: string, code: string): Promise<OtpCheck> {
    const key = this.key('code', email);
    const raw = await this.redis.get(key);
    if (!raw) return { result: 'expired' };
    const stored = JSON.parse(raw) as StoredOtp;
    if (stored.attempts >= OTP_MAX_ATTEMPTS) return { result: 'too_many_attempts' };

    const expected = Buffer.from(stored.hash, 'hex');
    const actual = Buffer.from(this.hashCode(email, code), 'hex');
    if (timingSafeEqual(expected, actual)) {
      await this.redis.del(key);
      return { result: 'ok' };
    }

    stored.attempts += 1;
    const ttl = await this.redis.ttl(key);
    await this.redis.set(key, JSON.stringify(stored), 'EX', Math.max(ttl, 1));
    const attemptsLeft = OTP_MAX_ATTEMPTS - stored.attempts;
    return attemptsLeft > 0 ? { result: 'invalid', attemptsLeft } : { result: 'too_many_attempts' };
  }
}
