import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Link } from '@/shared/i18n/routing';

export const metadata: Metadata = { robots: { index: false } };

/** Phone: full screen. Desktop: a centred card (design D9–D11). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg md:items-center md:justify-center md:bg-surface">
      <div className="flex w-full flex-1 flex-col px-4 pt-6 pb-8 md:max-w-md md:flex-none md:rounded-xl md:bg-bg md:p-10">
        <Link href="/" className="text-h2 font-bold">
          Click<span className="text-accent-text">Auto</span>
        </Link>
        <div className="mt-10 flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}
