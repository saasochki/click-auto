'use client';

import { useState } from 'react';
import { ListingPhoto } from '@/entities/listing/listing-photo';
import type { ListingDtoPhotosItem } from '@/shared/api/generated/model';

/** Swipeable photos with the "1 / 12" counter (design 05). Native scroll snap, no library. */
export function Gallery({ photos, alt }: { photos: ListingDtoPhotosItem[]; alt: string }) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) {
    return <ListingPhoto photo={undefined} alt={alt} className="aspect-4/3 w-full md:rounded-lg" />;
  }
  return (
    <div className="relative">
      <div
        className="flex aspect-4/3 w-full snap-x snap-mandatory overflow-x-auto md:rounded-lg"
        onScroll={(event) => {
          const el = event.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {photos.map((photo, i) => (
          <ListingPhoto
            key={photo.id}
            photo={photo}
            size="full"
            alt={alt}
            priority={i === 0}
            className="h-full w-full shrink-0 snap-center"
          />
        ))}
      </div>
      {photos.length > 1 ? (
        <span className="absolute right-3 bottom-3 rounded-full bg-overlay/60 px-2.5 py-1 text-caption text-white">
          {index + 1} / {photos.length}
        </span>
      ) : null}
    </div>
  );
}
