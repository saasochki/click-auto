import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { EditListing } from '@/widgets/listing-editor/listing-editor';

export default function EditListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  setRequestLocale(locale);
  return <EditListing id={id} />;
}
