import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AccountGate } from '@/widgets/account-gate/account-gate';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Personal pages: noindex, only for signed-in users with a finished profile. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountGate>{children}</AccountGate>;
}
