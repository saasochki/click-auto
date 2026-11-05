import type { ListingType } from '@clickauto/shared';

const SECTION: Record<ListingType, string> = { car: 'cars', goods: 'goods', service: 'services' };

const CYRILLIC: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/** URL slug from the title: "Toyota Camry, 2018" -> "toyota-camry-2018". Only for readability; the id decides. */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      // Cyrillic first: NFD would split "й" and "ё" into a letter and a diacritic.
      .replace(/[а-яё]/g, (ch) => CYRILLIC[ch] ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
  );
}

/** Card path without the locale: /cars/item/<id>-<slug>. */
export function listingHref(listing: { id: string; type: ListingType; title: string }): string {
  const slug = slugify(listing.title);
  return `/${SECTION[listing.type]}/item/${listing.id}${slug ? `-${slug}` : ''}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Listing id from the card URL segment "<id>-<slug>". */
export function listingIdFromSegment(segment: string): string | null {
  return UUID.exec(segment)?.[0]?.toLowerCase() ?? null;
}
