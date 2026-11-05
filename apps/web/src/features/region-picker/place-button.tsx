'use client';

import { cn } from '@clickauto/ui';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGetNearestCity } from '@/shared/api/generated/catalog/catalog';
import { savePlace, type Place } from '@/shared/lib/place';
import { ChevronDownIcon, PinIcon } from '@/shared/ui/icons';
import { usePlaceLabel } from './place-label';

/** The picker loads only when it opens. */
const RegionPicker = dynamic(() => import('./region-picker').then((m) => m.RegionPicker));

/** The picker opens on its own once per session at most. */
const ASKED_KEY = 'ca_place_asked';

function askedThisSession(): boolean {
  try {
    return sessionStorage.getItem(ASKED_KEY) === '1';
  } catch {
    return true;
  }
}

function markAsked(): void {
  try {
    sessionStorage.setItem(ASKED_KEY, '1');
  } catch {
    // Private mode: the picker may open again, nothing breaks.
  }
}

/**
 * Header pill with the current place (design 01, 04). With no saved place it asks the browser
 * for geolocation and picks the nearest city; if that fails it opens the picker. Until a choice
 * is made the feeds search everywhere. A manual choice replaces geolocation.
 */
export function PlaceButton({
  place,
  onChange,
  className,
}: {
  /** From the ca_place cookie, read on the server. */
  place: Place | null;
  /** Feeds pass this to drop the place from their URL; otherwise the page is refreshed. */
  onChange?: (place: Place) => void;
  className?: string;
}) {
  const router = useRouter();
  const label = usePlaceLabel(place);
  const [open, setOpen] = useState(false);
  const [geoFailed, setGeoFailed] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const nearest = useGetNearestCity(coords ?? { lat: 0, lng: 0 }, {
    query: { enabled: coords !== null, retry: false, staleTime: Infinity },
  });

  const apply = (next: Place) => {
    savePlace(next);
    setOpen(false);
    if (onChange) onChange(next);
    else router.refresh();
  };

  useEffect(() => {
    if (place || askedThisSession()) return;
    markAsked();
    const fail = () => {
      setGeoFailed(true);
      setOpen(true);
    };
    if (!('geolocation' in navigator)) return fail();
    navigator.geolocation.getCurrentPosition(
      (position) => setCoords({ lat: position.coords.latitude, lng: position.coords.longitude }),
      fail,
      { timeout: 10_000, maximumAge: 600_000 },
    );
  }, [place]);

  useEffect(() => {
    if (!coords) return;
    if (nearest.data?.status === 200) {
      savePlace({ kind: 'city', slug: nearest.data.data.city.slug });
      router.refresh();
    } else if (nearest.isError) {
      setGeoFailed(true);
      setOpen(true);
    }
  }, [coords, nearest.data, nearest.isError, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setGeoFailed(false);
          setOpen(true);
        }}
        className={cn(
          'inline-flex h-10 max-w-48 items-center gap-1.5 rounded-full bg-surface px-3 text-label font-semibold text-text hover:bg-border',
          className,
        )}
      >
        <PinIcon className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-text-muted" />
      </button>
      {open ? (
        <RegionPicker
          open
          onClose={() => setOpen(false)}
          current={place}
          geoFailed={geoFailed}
          onSelect={apply}
        />
      ) : null}
    </>
  );
}
