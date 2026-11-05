import { Injectable } from '@nestjs/common';
import { newId, type MediaFile } from '@clickauto/db';
import sharp from 'sharp';
import type { z } from 'zod';
import { AppError } from '../../common/problem';
import { PrismaService } from '../../prisma/prisma.service';
import type { photoSchema } from './dto';
import { StorageService } from './storage.service';

const MAX_SIDE = 2560;

/** Public service of the media module. */
@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createUpload(ownerId: string, mimeType: string, sizeBytes: number) {
    const id = newId();
    const key = `photos/${id.slice(0, 2)}/${id}`;
    await this.prisma.mediaFile.create({
      data: { id, ownerId, storageKey: key, mimeType, sizeBytes },
    });
    return { mediaId: id, uploadUrl: await this.storage.presignPut(key, mimeType, sizeBytes) };
  }

  /**
   * Called after the browser uploaded the file: re-encodes it to JPEG, applies EXIF rotation and
   * strips all metadata (location, camera), records the size.
   */
  async complete(ownerId: string, mediaId: string): Promise<z.infer<typeof photoSchema>> {
    const media = await this.prisma.mediaFile.findUnique({ where: { id: mediaId } });
    if (!media || media.ownerId !== ownerId) throw new AppError(404, 'not_found');
    if (media.uploaded) return this.toPhoto(media);

    let original: Buffer;
    try {
      original = await this.storage.read(media.storageKey);
    } catch {
      throw new AppError(409, 'upload_missing');
    }
    let processed: { data: Buffer; info: sharp.OutputInfo };
    try {
      processed = await sharp(original, { failOn: 'error' })
        .rotate()
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new AppError(422, 'image_invalid');
    }
    await this.storage.write(media.storageKey, processed.data, 'image/jpeg');
    const saved = await this.prisma.mediaFile.update({
      where: { id: media.id },
      data: {
        uploaded: true,
        mimeType: 'image/jpeg',
        sizeBytes: processed.info.size,
        width: processed.info.width,
        height: processed.info.height,
      },
    });
    return this.toPhoto(saved);
  }

  /** Ensures every id is an uploaded photo of this owner. Returns ids in the given order. */
  async assertOwnedPhotos(ownerId: string, ids: string[]): Promise<string[]> {
    if (new Set(ids).size !== ids.length) {
      throw new AppError(422, 'validation_failed', [{ field: 'photoIds', code: 'duplicate' }]);
    }
    const count = await this.prisma.mediaFile.count({
      where: { id: { in: ids }, ownerId, uploaded: true },
    });
    if (count !== ids.length) {
      throw new AppError(422, 'validation_failed', [{ field: 'photoIds', code: 'unknown' }]);
    }
    return ids;
  }

  /** Photo URLs by media id, for listing cards. */
  async photos(ids: string[]): Promise<Map<string, z.infer<typeof photoSchema>>> {
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.mediaFile.findMany({ where: { id: { in: ids } } });
    return new Map(rows.map((m) => [m.id, this.toPhoto(m)]));
  }

  /** Feed thumbnail by storage key: search documents keep the key, not the media id. */
  thumbUrl(storageKey: string): string {
    return this.storage.imageUrl(storageKey, 480, 360);
  }

  toPhoto(
    media: Pick<MediaFile, 'id' | 'storageKey' | 'width' | 'height'>,
  ): z.infer<typeof photoSchema> {
    return {
      id: media.id,
      url: this.storage.imageUrl(media.storageKey, 1280, 960),
      thumbUrl: this.storage.imageUrl(media.storageKey, 480, 360),
      width: media.width,
      height: media.height,
    };
  }
}
