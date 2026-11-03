import { LOCALES } from '@clickauto/shared';
import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

/** Locale is always the first URL segment: /ru/..., /ro/... */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'ru',
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
