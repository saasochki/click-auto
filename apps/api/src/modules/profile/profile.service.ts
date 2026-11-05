import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PublicUser {
  id: string;
  username: string | null;
  name: string | null;
  createdAt: string;
}

/** Public service of the profile module: other modules read user data only through it. */
@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public data of users. Deleted users come back as anonymous (no name, no username). */
  async publicUsers(ids: string[]): Promise<Map<string, PublicUser>> {
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.user.findMany({
      where: { id: { in: [...new Set(ids)] } },
      select: { id: true, username: true, name: true, status: true, createdAt: true },
    });
    return new Map(
      rows.map((u) => [
        u.id,
        {
          id: u.id,
          username: u.status === 'deleted' ? null : u.username,
          name: u.status === 'deleted' ? null : u.name,
          createdAt: u.createdAt.toISOString(),
        },
      ]),
    );
  }

  async contactPhone(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    return user?.phone ?? null;
  }
}
