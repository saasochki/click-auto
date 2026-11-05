import { useLocale, useTranslations } from 'next-intl';
import type { ListingDto } from '@/shared/api/generated/model';
import { formatNumber, formatPrice } from '@/shared/lib/format';

type Priced = Pick<ListingDto, 'price' | 'priceNegotiable'>;

/** "15 900 $" in the author's currency, or "Договорная". */
export function ListingPrice({ listing, className }: { listing: Priced; className?: string }) {
  const locale = useLocale();
  const t = useTranslations('listing');
  const text = listing.price
    ? formatPrice(listing.price.amount, listing.price.currency, locale)
    : t('negotiable');
  return <span className={className}>{text}</span>;
}

/** One line under the title in lists: "2,5 AT · 98 000 км · Тирасполь". */
export function useListingSubtitle(): (listing: ListingDto) => string {
  const locale = useLocale();
  const t = useTranslations('dict');
  const tl = useTranslations('listing');
  return (listing) => {
    const parts: string[] = [];
    const car = listing.car;
    if (car) {
      const engine = car.engineVolumeCc
        ? formatNumber(Math.round(car.engineVolumeCc / 100) / 10, locale)
        : '';
      const gearbox = car.transmission ? t(`transmissionShort.${car.transmission}`) : '';
      const engineLine = [engine, gearbox].filter(Boolean).join(' ');
      if (engineLine) parts.push(engineLine);
      if (car.mileageKm !== null)
        parts.push(tl('km', { value: formatNumber(car.mileageKm, locale) }));
    }
    if (listing.goods) parts.push(listing.goods.category.name);
    if (listing.service) parts.push(listing.service.category.name);
    parts.push(listing.city.name);
    return parts.join(' · ');
  };
}
