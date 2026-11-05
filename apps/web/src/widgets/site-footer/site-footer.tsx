import { useTranslations } from 'next-intl';
import { Link } from '@/shared/i18n/routing';
import { Logo } from '@/shared/ui/logo';

/** Desktop footer (D1, D2): about, sections, languages. */
export function SiteFooter() {
  const t = useTranslations('footer');
  const th = useTranslations('header');
  return (
    <footer className="mt-16 hidden bg-surface lg:block">
      <div className="mx-auto flex max-w-page flex-col gap-8 px-6 py-10">
        <div className="flex justify-between gap-8">
          <div className="flex max-w-xs flex-col gap-2">
            <Logo />
            <p className="text-caption text-text-muted">{t('about')}</p>
          </div>
          <nav className="flex flex-col gap-2 text-label">
            <span className="font-semibold">{t('sections')}</span>
            <Link href="/cars" className="text-text-muted hover:text-text">
              {th('cars')}
            </Link>
            <Link href="/goods" className="text-text-muted hover:text-text">
              {th('goods')}
            </Link>
            <Link href="/services" className="text-text-muted hover:text-text">
              {th('services')}
            </Link>
          </nav>
        </div>
        <div className="flex justify-between border-t border-border pt-6 text-caption text-text-muted">
          <span>{t('copyright', { year: new Date().getFullYear() })}</span>
          <span className="flex gap-2">
            <Link href="/" locale="ru" hrefLang="ru" className="hover:text-text">
              Русский
            </Link>
            <span aria-hidden>·</span>
            <Link href="/" locale="ro" hrefLang="ro" className="hover:text-text">
              Română
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
