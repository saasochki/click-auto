import { setRequestLocale } from 'next-intl/server';
import { readPlace } from '@/shared/lib/place-server';
import { BottomNav } from '@/widgets/bottom-nav/bottom-nav';
import { Home } from '@/widgets/home/home';
import { SiteFooter } from '@/widgets/site-footer/site-footer';
import { SiteHeader } from '@/widgets/site-header/site-header';

// The place cookie changes the blocks: rendered per request, API answers are cached for a minute.
export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const place = await readPlace();
  return (
    <>
      <SiteHeader place={place} />
      <main>
        <Home place={place} />
      </main>
      <SiteFooter />
      <BottomNav />
    </>
  );
}
