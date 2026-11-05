import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Suspense, use } from 'react';
import { Link } from '@/shared/i18n/routing';
import { PlusIcon } from '@/shared/ui/icons';
import { AccountHeader } from '@/widgets/account-header/account-header';
import { MyListings } from '@/widgets/my-listings/my-listings';

export default function MyListingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('myListings');
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-10">
      <AccountHeader
        title={t('title')}
        backHref="/"
        backLabel={t('back')}
        action={
          <Link href="/me/listings/new" aria-label={t('new')} className="-mr-2 p-2">
            <PlusIcon className="size-6" />
          </Link>
        }
      />
      <Suspense>
        <MyListings />
      </Suspense>
    </main>
  );
}
