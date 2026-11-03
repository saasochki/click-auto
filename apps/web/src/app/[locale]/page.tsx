import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('home');

  return (
    <main className="mx-auto max-w-page px-4 py-8 md:px-6">
      <p className="text-h2 font-bold">
        Click<span className="text-accent-text">Auto</span>
      </p>
      <h1 className="mt-8 text-display">{t('title')}</h1>
      <p className="mt-2 text-body text-text-muted">{t('subtitle')}</p>
    </main>
  );
}
