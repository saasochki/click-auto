import type { ListingStatus } from '@clickauto/shared';
import { cn } from '@clickauto/ui';
import { useTranslations } from 'next-intl';

const STYLES: Record<ListingStatus, string> = {
  active: 'bg-success-subtle text-success',
  draft: 'bg-surface-raised text-text-muted',
  hidden: 'bg-surface-raised text-text-muted',
  removed: 'bg-surface-raised text-text-muted',
  blocked: 'bg-danger-subtle text-danger',
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  const t = useTranslations('dict.status');
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center rounded-full px-2.5 text-caption font-medium',
        STYLES[status],
      )}
    >
      {t(status)}
    </span>
  );
}
