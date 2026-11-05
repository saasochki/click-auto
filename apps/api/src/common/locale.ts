import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Locale } from '@clickauto/shared';
import type { Request } from 'express';

/** Locale from Accept-Language (`ru` / `ro`), defaults to `ru`. Dictionaries are localized by it. */
export function localeFromRequest(req: Request): Locale {
  const header = req.headers['accept-language'] ?? '';
  return header.trim().toLowerCase().startsWith('ro') ? 'ro' : 'ru';
}

export const RequestLocale = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Locale =>
    localeFromRequest(ctx.switchToHttp().getRequest<Request>()),
);

export const pickName = (locale: Locale, row: { nameRu: string; nameRo: string }): string =>
  locale === 'ro' ? row.nameRo : row.nameRu;
