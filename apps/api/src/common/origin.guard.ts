import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { AppError } from './problem';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection together with SameSite=Lax cookies: state-changing requests must come
 * from the site or the admin (docs/backend/02-architecture.md#безопасность).
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowed: Set<string>;

  constructor(@Inject(ENV) env: Env) {
    this.allowed = new Set(env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()));
  }

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;
    const origin = req.headers.origin;
    if (origin && this.allowed.has(origin)) return true;
    throw new AppError(403, 'bad_origin');
  }
}
