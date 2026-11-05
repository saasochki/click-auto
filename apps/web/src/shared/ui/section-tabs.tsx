import type { ListingType } from '@clickauto/shared';
import { cn } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { Link } from '@/shared/i18n/routing';

const TABS: {
  type: ListingType;
  href: '/' | '/goods' | '/services';
  key: 'cars' | 'goods' | 'services';
}[] = [
  { type: 'car', href: '/', key: 'cars' },
  { type: 'goods', href: '/goods', key: 'goods' },
  { type: 'service', href: '/services', key: 'services' },
];

/** "Авто / Товары / Услуги" under the home search (design 01, 09, 21): switches the section. */
export function SectionTabs({ active }: { active: ListingType }) {
  const t = useTranslations('header');
  return (
    <nav className="flex rounded-md bg-surface p-1 lg:hidden">
      {TABS.map((tab) => (
        <Link
          key={tab.type}
          href={tab.href}
          aria-current={tab.type === active ? 'page' : undefined}
          className={cn(
            'flex h-10 flex-1 items-center justify-center rounded-sm text-label transition-colors',
            tab.type === active
              ? 'bg-bg font-semibold text-text shadow-sm'
              : 'text-text-muted hover:text-text',
          )}
        >
          {t(tab.key)}
        </Link>
      ))}
    </nav>
  );
}
