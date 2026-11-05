import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { ListingPrice } from '@/entities/listing/listing-meta';
import { SOURCE_NAMES } from '@/entities/listing/source';
import type { ListingDto } from '@/shared/api/generated/model';
import { Link } from '@/shared/i18n/routing';
import { formatDate, formatNumber, formatYear } from '@/shared/lib/format';
import { BackIcon, PhoneIcon, PinIcon } from '@/shared/ui/icons';
import { Description, VinCopy } from './card-parts';
import { Gallery } from './gallery';

function Spec({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-3 text-body last:border-b-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function KeySpec({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-surface p-3">
      <span className="text-h3">{value}</span>
      <span className="text-caption text-text-muted">{label}</span>
    </div>
  );
}

/** Public card of a car, goods or service listing (design 05, 10, 20, 22). */
export function ListingCard({ listing }: { listing: ListingDto }) {
  const t = useTranslations('listing');
  const d = useTranslations('dict');
  const locale = useLocale();
  const car = listing.car;
  const goods = listing.goods;
  const service = listing.service;
  const sellerName = listing.owner?.name ?? listing.contactName;

  const specs: { label: string; value: ReactNode }[] = [];
  if (car) {
    if (car.bodyType) specs.push({ label: t('specs.body'), value: d(`bodyType.${car.bodyType}`) });
    const engine = [
      car.engineVolumeCc
        ? t('liters', { value: formatNumber(Math.round(car.engineVolumeCc / 100) / 10, locale) })
        : null,
      car.powerHp ? t('hp', { value: car.powerHp }) : null,
      car.fuelTypes.length
        ? car.fuelTypes.map((f) => d(`fuel.${f}`).toLowerCase()).join(', ')
        : null,
    ].filter(Boolean);
    if (engine.length) specs.push({ label: t('specs.engine'), value: engine.join(', ') });
    if (car.transmission)
      specs.push({ label: t('specs.transmission'), value: d(`transmission.${car.transmission}`) });
    if (car.drive) specs.push({ label: t('specs.drive'), value: d(`drive.${car.drive}`) });
    if (car.steering)
      specs.push({ label: t('specs.steering'), value: d(`steering.${car.steering}`) });
    if (car.color) specs.push({ label: t('specs.color'), value: d(`color.${car.color}`) });
    if (car.ownersCount !== null) specs.push({ label: t('specs.owners'), value: car.ownersCount });
  }
  if (goods) {
    specs.push({ label: t('specs.category'), value: goods.category.name });
    for (const [key, raw] of Object.entries(goods.attributes)) {
      const label = d.has(`attr.${key}`) ? d(`attr.${key}`) : key;
      const option = (v: string) =>
        d.has(`attrOption.${key}.${v}`) ? d(`attrOption.${key}.${v}`) : v;
      let value: string;
      if (typeof raw === 'boolean') value = raw ? t('yes') : t('no');
      else if (Array.isArray(raw)) value = raw.map((v) => option(String(v))).join(', ');
      else value = option(String(raw));
      specs.push({ label, value });
    }
  }
  if (service) {
    specs.push({ label: t('specs.category'), value: service.category.name });
    if (service.address) specs.push({ label: t('specs.address'), value: service.address });
    if (service.workingHours)
      specs.push({ label: t('specs.workingHours'), value: service.workingHours });
    if (service.mobileService) specs.push({ label: t('specs.mobileService'), value: t('yes') });
  }

  const chips: { text: string; accent?: boolean }[] = [];
  if (car) {
    chips.push({ text: d(`carCondition.${car.condition}`) });
    if (car.registration)
      chips.push({ text: t('registrationChip', { value: d(`registration.${car.registration}`) }) });
    if (car.exchangePossible) chips.push({ text: t('exchange'), accent: true });
  }
  if (goods) chips.push({ text: d(`goodsCondition.${goods.condition}`) });

  return (
    <div className="mx-auto w-full max-w-page pb-28 md:px-6 md:pt-6">
      <div className="relative">
        <Link
          href="/"
          aria-label={t('back')}
          className="absolute top-3 left-3 z-10 flex size-10 items-center justify-center rounded-full bg-overlay/50 text-white md:hidden"
        >
          <BackIcon className="size-5" />
        </Link>
        <Gallery photos={listing.photos} alt={listing.title} />
      </div>

      <div className="flex flex-col gap-6 px-4 pt-4 md:px-0">
        <section className="flex flex-col gap-2">
          <ListingPrice listing={listing} className="text-h1 font-bold" />
          <h1 className="text-h2">{listing.title}</h1>
          <p className="flex items-center gap-1 text-label text-text-muted">
            <PinIcon className="size-4" />
            {listing.city.name}
            {listing.publishedAt
              ? ` · ${t('publishedOn', { date: formatDate(listing.publishedAt, locale) })}`
              : null}
          </p>
          {chips.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {chips.map((chip) => (
                <span
                  key={chip.text}
                  className={
                    chip.accent
                      ? 'rounded-full bg-accent-subtle px-3 py-1 text-caption text-accent-text'
                      : 'rounded-full bg-surface px-3 py-1 text-caption'
                  }
                >
                  {chip.text}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {listing.source ? (
          <p className="rounded-md bg-surface px-4 py-3 text-label text-text-muted">
            {t('importedFrom')}{' '}
            <a
              href={listing.source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-semibold text-text underline"
            >
              {SOURCE_NAMES[listing.source.code] ?? listing.source.code}
            </a>
          </p>
        ) : null}

        {car ? (
          <section className="grid grid-cols-3 gap-2">
            {car.mileageKm !== null ? (
              <KeySpec value={formatNumber(car.mileageKm, locale)} label={t('kmUnit')} />
            ) : null}
            {car.engineVolumeCc ? (
              <KeySpec
                value={t('liters', {
                  value: formatNumber(Math.round(car.engineVolumeCc / 100) / 10, locale),
                })}
                label={
                  car.fuelTypes[0] ? d(`fuel.${car.fuelTypes[0]}`).toLowerCase() : t('specs.engine')
                }
              />
            ) : null}
            <KeySpec value={String(car.year)} label={t('specs.year')} />
          </section>
        ) : null}

        {specs.length ? (
          <section className="flex flex-col gap-1">
            <h2 className="text-h3">{t('specsTitle')}</h2>
            <dl>
              {specs.map((spec) => (
                <Spec key={spec.label} label={spec.label} value={spec.value} />
              ))}
            </dl>
          </section>
        ) : null}

        {car?.vin ? <VinCopy vin={car.vin} /> : null}

        {listing.description ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-h3">{t('description')}</h2>
            <Description text={listing.description} />
          </section>
        ) : null}

        {sellerName ? (
          <section className="flex items-center gap-3 rounded-lg bg-surface p-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent-subtle text-label font-semibold text-accent-text">
              {sellerName.slice(0, 2).toUpperCase()}
            </span>
            <div className="flex flex-col">
              <span className="text-h3">{sellerName}</span>
              {listing.owner ? (
                <span className="text-caption text-text-muted">
                  {listing.owner.username ? `@${listing.owner.username} · ` : ''}
                  {t('memberSince', { year: formatYear(listing.owner.createdAt) })}
                </span>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      {listing.contactPhone ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg px-4 pt-3 pb-safe">
          <div className="mx-auto flex max-w-page gap-3">
            <a
              href={`tel:${listing.contactPhone}`}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-lg bg-accent text-body font-semibold text-accent-contrast hover:bg-accent-hover"
            >
              <PhoneIcon className="size-5" />
              {t('call')}
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Design 29: the listing is hidden, removed or blocked. */
export function ListingGone() {
  const t = useTranslations('listing.gone');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-display text-accent-text">410</p>
      <h1 className="text-h2">{t('title')}</h1>
      <p className="text-body text-text-muted">{t('text')}</p>
      <Link href="/" className="mt-3 text-body font-semibold">
        {t('home')}
      </Link>
    </main>
  );
}
