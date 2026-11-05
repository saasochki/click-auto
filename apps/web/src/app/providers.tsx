'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { useEffect, useRef, type ReactNode } from 'react';
import { getQueryClient } from '@/shared/api/query-client';

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const locale = useLocale();
  const previous = useRef(locale);

  // Dictionaries are localized by the API, query keys do not contain the locale: refetch on switch.
  useEffect(() => {
    if (previous.current === locale) return;
    previous.current = locale;
    void queryClient.invalidateQueries();
  }, [locale, queryClient]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
