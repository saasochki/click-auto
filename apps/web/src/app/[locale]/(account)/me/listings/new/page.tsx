import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Suspense, use } from 'react';
import { ListingTypePicker } from '@/features/listing-form/listing-type-picker';
import { AccountHeader } from '@/widgets/account-header/account-header';
import { NewListingByType } from '@/widgets/listing-editor/listing-editor';

export default function NewListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('listingForm.typePicker');
  // The type is read on the client from ?type=, so the page itself stays static.
  return (
    <Suspense>
      <NewListingByType
        picker={
          <main className="mx-auto w-full max-w-2xl px-4 pb-10">
            <AccountHeader title={t('title')} backHref="/me/listings" backLabel={t('back')} />
            <ListingTypePicker />
          </main>
        }
      />
    </Suspense>
  );
}
