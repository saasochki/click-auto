import {
  completeProfileSchema,
  emailStartSchema,
  emailVerifySchema,
  localeSchema,
  LOCALES,
  THEMES,
  USER_ROLES,
} from '@clickauto/shared';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class EmailStartDto extends createZodDto(
  emailStartSchema.extend({ locale: localeSchema.default('ru') }),
) {}

export class EmailVerifyDto extends createZodDto(emailVerifySchema) {}

export class CompleteProfileDto extends createZodDto(completeProfileSchema) {}

export const meSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  cityId: z.string().uuid().nullable(),
  locale: z.enum(LOCALES),
  theme: z.enum(THEMES),
  role: z.enum(USER_ROLES),
  /** True until the user has chosen a username and a name. */
  needsProfile: z.boolean(),
  createdAt: z.string().datetime(),
});

export class MeDto extends createZodDto(meSchema) {}

export class AuthResultDto extends createZodDto(z.object({ user: meSchema })) {}

export class OtpErrorMetaDto extends createZodDto(
  z.object({ attemptsLeft: z.number().int().nonnegative() }),
) {}
