'use client';

import { useEffect, type ReactNode } from 'react';
import { useGetMe } from '@/shared/api/generated/me/me';
import { usePathname, useRouter } from '@/shared/i18n/routing';

/**
 * Middleware already sends visitors without a session cookie to /login. Here the session is
 * checked for real: an expired one also goes to /login, an unfinished profile to /signup/profile.
 */
export function AccountGate({ children }: { children: ReactNode }) {
  const me = useGetMe({ query: { retry: false } });
  const router = useRouter();
  const pathname = usePathname();
  const user = me.data?.status === 200 ? me.data.data : null;

  useEffect(() => {
    if (me.isError) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (user?.needsProfile) router.replace('/signup/profile');
  }, [me.isError, user, router, pathname]);

  if (!user || user.needsProfile) {
    return <div className="min-h-dvh" aria-busy />;
  }
  return <>{children}</>;
}
