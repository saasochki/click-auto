'use client';

import { Button } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { listingHref } from '@/entities/listing/listing-href';
import type { ListingDto } from '@/shared/api/generated/model';
import { Link, useRouter } from '@/shared/i18n/routing';
import { ShareIcon } from '@/shared/ui/icons';

/** Design 26: success after publishing. */
export function Published({ listing }: { listing: ListingDto }) {
  const t = useTranslations('listingForm.published');
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const href = listingHref(listing);

  const share = async () => {
    const url = `${window.location.origin}/${document.documentElement.lang}${href}`;
    if (navigator.share) {
      await navigator.share({ title: listing.title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-6 pb-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-success-subtle text-success">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-h1">{t('title')}</h1>
        <p className="text-body text-text-muted">{t('text', { title: listing.title })}</p>
      </div>
      <div className="flex flex-col gap-3">
        <Button size="lg" fullWidth onClick={() => router.push(href)}>
          {t('open')}
        </Button>
        <Button
          kind="secondary"
          size="lg"
          fullWidth
          icon={<ShareIcon className="size-5" />}
          onClick={() => void share()}
        >
          {copied ? t('copied') : t('share')}
        </Button>
        <Link href="/me/listings" className="py-3 text-center text-body font-semibold">
          {t('toMyListings')}
        </Link>
      </div>
    </div>
  );
}
