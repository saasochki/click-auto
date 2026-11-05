import { cn } from '@clickauto/ui';
import type { ListingDtoPhotosItem } from '@/shared/api/generated/model';
import { ImageIcon } from '@/shared/ui/icons';

/**
 * Photo served by imgproxy: it already resizes and picks WebP/AVIF, so next/image optimization
 * would only add a second pass. Empty listings get a neutral placeholder.
 */
export function ListingPhoto({
  photo,
  alt,
  size = 'thumb',
  priority,
  className,
}: {
  photo: ListingDtoPhotosItem | undefined;
  alt: string;
  size?: 'thumb' | 'full';
  priority?: boolean;
  className?: string;
}) {
  if (!photo) {
    return (
      <div className={cn('flex items-center justify-center bg-surface text-text-muted', className)}>
        <ImageIcon className="size-8" />
      </div>
    );
  }
  return (
    <img
      src={size === 'thumb' ? photo.thumbUrl : photo.url}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={cn('bg-surface object-cover', className)}
    />
  );
}
