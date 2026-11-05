'use client';

import { LOCALES } from '@clickauto/shared';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/shared/i18n/routing';

/** The same page in the other language. */
export function LocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const other = LOCALES.find((l) => l !== locale) ?? 'ru';
  return (
    <Link
      href={search ? `${pathname}?${search}` : pathname}
      locale={other}
      hrefLang={other}
      className="flex h-10 items-center rounded-full px-2 text-label font-semibold text-text-muted uppercase hover:text-text"
    >
      {other}
    </Link>
  );
}
