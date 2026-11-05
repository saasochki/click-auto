'use client';

import { Button } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CopyIcon } from '@/shared/ui/icons';

/** VIN with "Скопировать": we do not check VINs, only let buyers copy them. */
export function VinCopy({ vin }: { vin: string }) {
  const t = useTranslations('listing');
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-caption text-text-muted">VIN</span>
        <span className="font-mono text-body font-semibold tracking-wide">{vin}</span>
      </div>
      <Button
        kind="outline"
        size="sm"
        icon={<CopyIcon className="size-4" />}
        onClick={() => {
          void navigator.clipboard.writeText(vin).then(() => setCopied(true));
        }}
      >
        {copied ? t('copied') : t('copy')}
      </Button>
    </div>
  );
}

/** Long descriptions are cut to a few lines with "Показать полностью". */
export function Description({ text }: { text: string }) {
  const t = useTranslations('listing');
  const [open, setOpen] = useState(false);
  const long = text.length > 280 || text.split('\n').length > 5;
  return (
    <div className="flex flex-col gap-2">
      <p
        className={
          open || !long
            ? 'text-body whitespace-pre-line'
            : 'line-clamp-5 text-body whitespace-pre-line'
        }
      >
        {text}
      </p>
      {long && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start text-label font-semibold text-accent-text"
        >
          {t('showAll')}
        </button>
      ) : null}
    </div>
  );
}
