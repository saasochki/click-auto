import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { HeaderAccount } from '@/widgets/header/header-account';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('home');

  return (
    <main className="mx-auto max-w-page px-4 py-6 md:px-6">
      <header className="flex items-center justify-between">
        <p className="text-h2 font-bold">
          Click<span className="text-accent-text">Auto</span>
        </p>
        <HeaderAccount />
      </header>
      <h1 className="mt-8 text-display">{t('title')}</h1>
      <p className="mt-2 text-body text-text-muted">{t('subtitle')}</p>
    </main>
  );
}
