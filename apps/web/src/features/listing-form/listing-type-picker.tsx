import type { ListingType } from '@clickauto/shared';
import { useTranslations } from 'next-intl';
import { Link } from '@/shared/i18n/routing';
import { ChevronRightIcon } from '@/shared/ui/icons';

const TYPES: readonly ListingType[] = ['car', 'goods', 'service'];

/** Design 16 "Что размещаем?": the first step of a new listing. */
export function ListingTypePicker() {
  const t = useTranslations('listingForm.typePicker');
  return (
    <div className="flex flex-col gap-3">
      {TYPES.map((type) => (
        <Link
          key={type}
          href={`/me/listings/new?type=${type}`}
          className="flex items-center gap-4 rounded-lg bg-surface p-4 transition-colors hover:bg-border"
        >
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-h3">{t(`${type}.title`)}</span>
            <span className="text-label text-text-muted">{t(`${type}.text`)}</span>
          </div>
          <ChevronRightIcon className="size-5 text-text-muted" />
        </Link>
      ))}
    </div>
  );
}
