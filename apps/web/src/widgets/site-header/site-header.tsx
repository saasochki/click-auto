import type { ListingType } from '@clickauto/shared';
import { cn } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { PlaceButton } from '@/features/region-picker/place-button';
import { SearchField } from '@/features/search-field/search-field';
import { FEED_PATH } from '@/entities/feed/filters';
import { Link } from '@/shared/i18n/routing';
import type { Place } from '@/shared/lib/place';
import { PlusIcon } from '@/shared/ui/icons';
import { Logo } from '@/shared/ui/logo';
import { HeaderAccount } from './header-account';
import { LocaleSwitch } from './locale-switch';

const SECTIONS: { type: ListingType; key: 'cars' | 'goods' | 'services' }[] = [
  { type: 'car', key: 'cars' },
  { type: 'goods', key: 'goods' },
  { type: 'service', key: 'services' },
];

/**
 * Site header. Desktop: logo, sections, search, place, language, "Разместить", account (D1, D2).
 * Phone: logo and place (design 01, 09, 21); pages with their own top bar hide it.
 */
export function SiteHeader({
  section,
  place,
  mobile = 'brand',
}: {
  section?: ListingType;
  place: Place | null;
  mobile?: 'brand' | 'none';
}) {
  const t = useTranslations('header');
  return (
    <header className="lg:border-b lg:border-border">
      <div
        className={cn(
          'mx-auto flex max-w-page items-center justify-between gap-3 px-4 pt-4 md:px-6 lg:hidden',
          mobile === 'none' && 'hidden',
        )}
      >
        <Logo />
        <PlaceButton place={place} />
      </div>
      <div className="mx-auto hidden h-16 max-w-page items-center gap-4 px-6 lg:flex">
        <Logo />
        <nav className="flex items-center gap-1">
          {SECTIONS.map((item) => (
            <Link
              key={item.type}
              href={FEED_PATH[item.type]}
              aria-current={section === item.type ? 'page' : undefined}
              className={cn(
                'flex h-9 items-center rounded-full px-3 text-label',
                section === item.type
                  ? 'bg-surface font-semibold text-text'
                  : 'text-text-muted hover:text-text',
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <SearchField type={section ?? 'car'} size="sm" className="ml-2 max-w-xs flex-1" />
        <PlaceButton place={place} />
        <div className="ml-auto flex items-center gap-3">
          <Suspense>
            <LocaleSwitch />
          </Suspense>
          <Link
            href="/me/listings/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 text-label font-semibold text-accent-contrast hover:bg-accent-hover"
          >
            <PlusIcon className="size-5" />
            {t('post')}
          </Link>
          <HeaderAccount />
        </div>
      </div>
    </header>
  );
}
