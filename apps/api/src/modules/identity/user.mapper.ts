import type { User } from '@clickauto/db';
import type { z } from 'zod';
import type { meSchema } from './dto';

export function toMe(user: User): z.infer<typeof meSchema> {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    phone: user.phone,
    cityId: user.cityId,
    locale: user.locale,
    theme: user.theme,
    role: user.role,
    needsProfile: !user.username || !user.name,
    createdAt: user.createdAt.toISOString(),
  };
}
