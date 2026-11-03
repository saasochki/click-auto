import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { newId, type Session, type User } from '@clickauto/db';
import { STAFF_SESSION_HOURS } from '@clickauto/shared';
import type { CookieOptions, Response } from 'express';
import { ENV } from '../../config/config.module';
import type { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';

export const SESSION_COOKIE = 'ca_session';
/** User sessions slide: each visit extends them back to 30 days. Staff sessions never extend. */
const USER_SESSION_DAYS = 30;
const EXTEND_WHEN_LEFT_DAYS = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

export interface ResolvedSession {
  session: Session;
  user: User;
}

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async create(user: User, meta: SessionMeta): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('base64url');
    const isStaff = user.role !== 'user';
    const expiresAt = new Date(
      Date.now() + (isStaff ? STAFF_SESSION_HOURS * 60 * 60 * 1000 : USER_SESSION_DAYS * DAY_MS),
    );
    await this.prisma.session.create({
      data: {
        id: newId(),
        userId: user.id,
        tokenHash: hashToken(token),
        isStaff,
        expiresAt,
        userAgent: meta.userAgent?.slice(0, 300) ?? null,
        ip: meta.ip ?? null,
      },
    });
    return { token, expiresAt };
  }

  async resolve(token: string | undefined): Promise<ResolvedSession | null> {
    if (!token) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) return null;

    const now = Date.now();
    const shouldExtend =
      !session.isStaff && session.expiresAt.getTime() - now < EXTEND_WHEN_LEFT_DAYS * DAY_MS;
    if (shouldExtend || now - session.lastSeenAt.getTime() > 60 * 60 * 1000) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          lastSeenAt: new Date(now),
          ...(shouldExtend ? { expiresAt: new Date(now + USER_SESSION_DAYS * DAY_MS) } : {}),
        },
      });
    }
    const { user, ...rest } = session;
    return { session: rest, user };
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: this.env.COOKIE_DOMAIN || undefined,
    };
  }

  setCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(SESSION_COOKIE, token, { ...this.cookieOptions(), expires: expiresAt });
  }

  clearCookie(res: Response): void {
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }
}
