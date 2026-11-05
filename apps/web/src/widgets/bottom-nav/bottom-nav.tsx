'use client';

import { cn } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/shared/i18n/routing';
import { HomeIcon, PlusIcon, UserIcon } from '@/shared/ui/icons';

/**
 * Phone tab bar (design 01). Favorites and chats join it together with their sections.
 * Hidden from lg, where the header has everything.
 */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const home = pathname === '/' || /^\/(cars|goods|services)(\/|$)/.test(pathname);
  const profile = pathname.startsWith('/me');
  const item = (active: boolean) =>
    cn(
      'flex flex-1 flex-col items-center gap-0.5 pt-2 text-micro',
      active ? 'font-semibold text-text' : 'text-text-muted',
    );
  return (
    <>
      <div className="h-20 lg:hidden" aria-hidden />
      <nav
        aria-label={t('label')}
        className="fixed inset-x-0 bottom-0 z-20 flex items-start border-t border-border bg-bg pb-safe lg:hidden"
      >
        <Link href="/" className={item(home)} aria-current={home ? 'page' : undefined}>
          <HomeIcon className="size-6" />
          {t('home')}
        </Link>
        <Link href="/me/listings/new" className="flex flex-1 justify-center pt-1.5">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-contrast">
            <PlusIcon className="size-6" />
          </span>
          <span className="sr-only">{t('post')}</span>
        </Link>
        <Link
          href="/me/listings"
          className={item(profile)}
          aria-current={profile ? 'page' : undefined}
        >
          <UserIcon className="size-6" />
          {t('profile')}
        </Link>
      </nav>
    </>
  );
}
