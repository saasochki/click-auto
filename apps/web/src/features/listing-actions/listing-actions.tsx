'use client';

import { cn } from '@clickauto/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  hideListing,
  publishListing,
  removeListing,
  unhideListing,
} from '@/shared/api/generated/listings/listings';
import {
  getCountMyListingsQueryKey,
  getListMyListingsQueryKey,
} from '@/shared/api/generated/me/me';
import type { ListingDto } from '@/shared/api/generated/model';
import { ApiError } from '@/shared/api/http-client';
import { Link } from '@/shared/i18n/routing';
import { EditIcon, EyeIcon, EyeOffIcon, MoreIcon, SendIcon, TrashIcon } from '@/shared/ui/icons';

type Action = 'publish' | 'hide' | 'unhide' | 'remove';

const CALLS = {
  publish: publishListing,
  hide: hideListing,
  unhide: unhideListing,
  remove: removeListing,
};

/** Owner menu "⋮" on a listing in "Мои объявления" (design 13). */
export function ListingActions({
  listing,
  onDone,
}: {
  listing: ListingDto;
  /** Result for the toast: action that succeeded or an error code. */
  onDone: (result: { ok: true; action: Action } | { ok: false; code: string }) => void;
}) {
  const t = useTranslations('myListings.actions');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const act = useMutation({
    mutationFn: async (action: Action) => {
      const res = await CALLS[action](listing.id);
      // httpClient already throws ApiError on 4xx/5xx; this only narrows the type.
      if (res.status !== 200) throw new Error('unexpected_status');
      return action;
    },
    onSuccess: async (action) => {
      setOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListMyListingsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getCountMyListingsQueryKey() }),
      ]);
      onDone({ ok: true, action });
    },
    onError: (error) => {
      setOpen(false);
      onDone({ ok: false, code: error instanceof ApiError ? error.problem.code : 'unknown_error' });
    },
  });

  const status = listing.status;
  const editable = status === 'draft' || status === 'active' || status === 'hidden';
  const items: {
    key: string;
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    href?: string;
    danger?: boolean;
  }[] = [];
  if (editable)
    items.push({
      key: 'edit',
      icon: <EditIcon className="size-5" />,
      label: t('edit'),
      href: `/me/listings/${listing.id}/edit`,
    });
  if (status === 'draft')
    items.push({
      key: 'publish',
      icon: <SendIcon className="size-5" />,
      label: t('publish'),
      onClick: () => act.mutate('publish'),
    });
  if (status === 'active')
    items.push({
      key: 'hide',
      icon: <EyeOffIcon className="size-5" />,
      label: t('hide'),
      onClick: () => act.mutate('hide'),
    });
  if (status === 'hidden')
    items.push({
      key: 'unhide',
      icon: <EyeIcon className="size-5" />,
      label: t('unhide'),
      onClick: () => act.mutate('unhide'),
    });
  if (editable) {
    items.push({
      key: 'remove',
      icon: <TrashIcon className="size-5" />,
      label: confirmRemove ? t('removeConfirm') : t('remove'),
      danger: true,
      onClick: () => (confirmRemove ? act.mutate('remove') : setConfirmRemove(true)),
    });
  }
  if (items.length === 0) return null;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={t('menu')}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setConfirmRemove(false);
        }}
        className="-mr-2 flex size-10 items-center justify-center rounded-full hover:bg-border"
      >
        <MoreIcon className="size-6" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-11 right-0 z-20 w-64 overflow-hidden rounded-lg border border-border bg-surface-raised py-1 shadow-lg"
        >
          {items.map((item) => {
            const className = cn(
              'flex w-full items-center gap-3 px-4 py-3 text-left text-body hover:bg-surface disabled:opacity-50',
              item.danger && 'text-danger',
            );
            return item.href ? (
              <Link key={item.key} role="menuitem" href={item.href} className={className}>
                {item.icon}
                {item.label}
              </Link>
            ) : (
              <button
                key={item.key}
                role="menuitem"
                type="button"
                disabled={act.isPending}
                onClick={item.onClick}
                className={className}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
