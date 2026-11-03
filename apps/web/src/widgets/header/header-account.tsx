'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useLogout } from '@/shared/api/generated/auth/auth';
import { getGetMeQueryKey, useGetMe } from '@/shared/api/generated/me/me';
import { Link } from '@/shared/i18n/routing';

/** Right side of the header: sign-in link or the user's initials. */
export function HeaderAccount() {
  const t = useTranslations('header');
  const queryClient = useQueryClient();
  const me = useGetMe({ query: { retry: false } });
  const logout = useLogout();
  const user = me.data?.status === 200 ? me.data.data : null;

  if (!user) {
    return (
      <Link href="/login" className="text-label font-semibold text-text hover:text-accent-text">
        {t('login')}
      </Link>
    );
  }

  const initials = (user.name ?? user.email ?? '?').slice(0, 2).toUpperCase();
  return (
    <button
      type="button"
      title={user.username ? `@${user.username}` : undefined}
      onClick={() =>
        logout.mutate(undefined, {
          onSuccess: () => queryClient.resetQueries({ queryKey: getGetMeQueryKey() }),
        })
      }
      className="flex size-10 items-center justify-center rounded-full bg-accent-subtle text-label font-semibold text-accent-text"
    >
      {initials}
    </button>
  );
}
