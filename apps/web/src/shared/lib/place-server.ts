import { cookies } from 'next/headers';
import { parsePlace, PLACE_COOKIE, type Place } from './place';

/** Place saved in the ca_place cookie, for server components. */
export async function readPlace(): Promise<Place | null> {
  const raw = (await cookies()).get(PLACE_COOKIE)?.value ?? '';
  try {
    return parsePlace(decodeURIComponent(raw));
  } catch {
    return null;
  }
}
