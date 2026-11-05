'use client';

import type { ListingType } from '@clickauto/shared';
import { cn } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent, type ReactNode } from 'react';
import { emptyFilters, feedHref, type FeedFilters } from '@/entities/feed/filters';
import { useRouter } from '@/shared/i18n/routing';
import { SearchIcon } from '@/shared/ui/icons';

/**
 * Search field of the home page, feeds and the desktop header. Submitting opens the feed of
 * the type with the text; on a feed the other filters stay.
 */
export function SearchField({
  type,
  filters,
  action,
  size = 'lg',
  className,
}: {
  type: ListingType;
  /** Current feed filters; on other pages a fresh search. */
  filters?: FeedFilters;
  /** Button on the right, e.g. the filters button. */
  action?: ReactNode;
  size?: 'lg' | 'sm';
  className?: string;
}) {
  const t = useTranslations('feed');
  const router = useRouter();
  const [text, setText] = useState(filters?.q ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = text.trim() || null;
    router.push(feedHref(type, { ...(filters ?? emptyFilters()), q }));
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn(
        'flex items-center gap-2 rounded-lg bg-surface pr-1.5 pl-4',
        size === 'lg' ? 'h-14' : 'h-10',
        className,
      )}
    >
      <SearchIcon className="size-5 shrink-0 text-text-muted" />
      <input
        type="search"
        name="q"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={t(`searchPlaceholder.${type}`)}
        aria-label={t(`searchPlaceholder.${type}`)}
        enterKeyHint="search"
        className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-text-muted"
      />
      {action}
    </form>
  );
}
