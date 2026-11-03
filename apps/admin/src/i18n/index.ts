import ro from './ro.json';
import ru from './ru.json';

export type AdminLocale = 'ru' | 'ro';
type Dict = typeof ru;

const dictionaries: Record<AdminLocale, Dict> = { ru, ro };

/** Returns a translator for a dotted key such as `nav.dashboard`. Missing keys return the key. */
export function createT(locale: AdminLocale) {
  return (key: string): string => {
    const value = key
      .split('.')
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown> | undefined)?.[part],
        dictionaries[locale],
      );
    return typeof value === 'string' ? value : key;
  };
}
