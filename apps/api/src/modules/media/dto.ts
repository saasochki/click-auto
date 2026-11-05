import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Accepted photo formats and the technical size cap. */
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PHOTO_MAX_BYTES = 15 * 1024 * 1024;

export class CreateUploadDto extends createZodDto(
  z.object({
    mimeType: z.enum(PHOTO_MIME_TYPES),
    sizeBytes: z.number().int().positive().max(PHOTO_MAX_BYTES),
  }),
) {}

export class UploadTicketDto extends createZodDto(
  z.object({
    mediaId: z.string().uuid(),
    /** PUT the file here with the same Content-Type. Valid for 15 minutes. */
    uploadUrl: z.string().url(),
  }),
) {}

export const photoSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  thumbUrl: z.string().url(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
});

export class PhotoDto extends createZodDto(photoSchema) {}
