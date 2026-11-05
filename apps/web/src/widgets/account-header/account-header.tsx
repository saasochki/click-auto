import type { ReactNode } from 'react';
import { Link } from '@/shared/i18n/routing';
import { BackIcon } from '@/shared/ui/icons';

/** Top bar of personal pages: back, title, optional action on the right (design 13). */
export function AccountHeader({
  title,
  backHref,
  backLabel,
  action,
}: {
  title: string;
  backHref: string;
  backLabel: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex h-14 items-center gap-3">
      <Link href={backHref} aria-label={backLabel} className="-ml-2 p-2">
        <BackIcon className="size-6" />
      </Link>
      <h1 className="flex-1 text-h2">{title}</h1>
      {action}
    </header>
  );
}
