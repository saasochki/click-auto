import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { Link } from '@/shared/i18n/routing';
import { HeaderAccount } from '@/widgets/header/header-account';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('home');
  const th = useTranslations('header');

  return (
    <main className="mx-auto max-w-page px-4 py-6 md:px-6">
      <header className="flex items-center justify-between">
        <p className="text-h2 font-bold">
          Click<span className="text-accent-text">Auto</span>
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/me/listings/new"
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-label font-semibold text-accent-contrast hover:bg-accent-hover"
          >
            {th('post')}
          </Link>
          <HeaderAccount />
        </div>
      </header>
      <h1 className="mt-8 text-display">{t('title')}</h1>
      <p className="mt-2 text-body text-text-muted">{t('subtitle')}</p>
    </main>
  );
}
