'use client';

import { LISTING_PHOTOS_MAX } from '@clickauto/shared';
import { cn, Field } from '@clickauto/ui';
import { useTranslations } from 'next-intl';
import { useRef, useState, type PointerEvent } from 'react';
import { completePhotoUpload, createPhotoUpload } from '@/shared/api/generated/media/media';
import { putToPresignedUrl } from '@/shared/api/upload-file';
import { CameraIcon, CloseIcon } from '@/shared/ui/icons';
import type { FormPhoto } from './model';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AcceptedType = (typeof ACCEPT)[number];
const MAX_BYTES = 15 * 1024 * 1024;

async function uploadOne(file: File): Promise<FormPhoto> {
  const ticket = await createPhotoUpload({
    mimeType: file.type as AcceptedType,
    sizeBytes: file.size,
  });
  if (ticket.status !== 201) throw new Error('ticket');
  await putToPresignedUrl(ticket.data.uploadUrl, file, file.type);
  const done = await completePhotoUpload(ticket.data.mediaId);
  if (done.status !== 200) throw new Error('complete');
  return { id: done.data.id, thumbUrl: done.data.thumbUrl };
}

/**
 * Photos of a listing: upload straight to S3, the first one is the main photo,
 * order changes by dragging (mouse and touch) — design screens 17, 30, 32.
 */
export function PhotoPicker({
  photos,
  onChange,
  error,
}: {
  photos: FormPhoto[];
  /** Functional update: several uploads finish independently. */
  onChange: (update: (photos: FormPhoto[]) => FormPhoto[]) => void;
  error?: string;
}) {
  const t = useTranslations('listingForm.photos');
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setFailed(null);
    const room = LISTING_PHOTOS_MAX - photos.length - uploading;
    const picked = Array.from(files).slice(0, Math.max(room, 0));
    const valid = picked.filter(
      (file) => ACCEPT.includes(file.type as AcceptedType) && file.size <= MAX_BYTES,
    );
    if (valid.length < picked.length) setFailed('format');
    if (files.length > room) setFailed('limit');
    setUploading((n) => n + valid.length);
    await Promise.all(
      valid.map(async (file) => {
        try {
          const photo = await uploadOne(file);
          onChange((current) => [...current, photo].slice(0, LISTING_PHOTOS_MAX));
        } catch {
          setFailed('upload');
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  };

  const remove = (id: string) => onChange((current) => current.filter((photo) => photo.id !== id));

  /** Pointer-based reorder: works with touch, unlike HTML5 drag and drop. */
  const onPointerDown = (id: string) => (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(id);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const target = document
      .elementsFromPoint(event.clientX, event.clientY)
      .find(
        (el) => el instanceof HTMLElement && el.dataset.photoId && el.dataset.photoId !== dragging,
      );
    const overId = target instanceof HTMLElement ? target.dataset.photoId : undefined;
    if (!overId) return;
    onChange((current) => {
      const from = current.findIndex((photo) => photo.id === dragging);
      const to = current.findIndex((photo) => photo.id === overId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      if (moved) next.splice(to, 0, moved);
      return next;
    });
  };
  const onPointerUp = () => setDragging(null);

  return (
    <Field
      label={t('label')}
      aside={t('count', { count: photos.length, max: LISTING_PHOTOS_MAX })}
      hint={failed ? undefined : t('hint')}
      error={error ?? (failed ? t(`errors.${failed}`) : undefined)}
    >
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {photos.length + uploading < LISTING_PHOTOS_MAX ? (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-accent bg-accent-subtle text-caption text-accent-text"
          >
            <CameraIcon className="size-6" />
            {t('add')}
          </button>
        ) : null}
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            data-photo-id={photo.id}
            onPointerDown={onPointerDown(photo.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={cn(
              'relative aspect-square touch-none overflow-hidden rounded-md bg-surface select-none',
              dragging === photo.id && 'opacity-60 ring-2 ring-accent',
            )}
          >
            <img src={photo.thumbUrl} alt="" draggable={false} className="size-full object-cover" />
            {index === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-sm bg-overlay/70 px-1.5 text-micro text-white">
                {t('main')}
              </span>
            ) : null}
            <button
              type="button"
              aria-label={t('remove')}
              onClick={() => remove(photo.id)}
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-overlay/70 text-white"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <div
            key={`uploading-${i}`}
            className="aspect-square animate-pulse rounded-md bg-surface"
          />
        ))}
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(',')}
        multiple
        hidden
        onChange={(event) => {
          void addFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </Field>
  );
}
