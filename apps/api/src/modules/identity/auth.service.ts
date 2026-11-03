import { Injectable } from '@nestjs/common';
import { newId, Prisma, type User } from '@clickauto/db';
import type { Locale } from '@clickauto/shared';
import { AppError } from '../../common/problem';
import { MailService } from '../../infra/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { otpMail } from './mail-templates';
import { OtpService } from './otp.service';

export interface GoogleClaims {
  sub: string;
  email: string;
  name: string | null;
}

/** Sign-in and registration: email code and Google. Docs: docs/analytics/03-requirements.md#1. */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly mail: MailService,
  ) {}

  async startEmail(email: string, locale: Locale, ip: string): Promise<void> {
    const code = await this.otp.issue(email, ip);
    await this.mail.send(otpMail(email, code, locale));
  }

  /** Checks the code; creates the user on first sign-in. */
  async verifyEmail(email: string, code: string): Promise<User> {
    const check = await this.otp.check(email, code);
    if (check.result === 'expired') throw new AppError(422, 'otp_expired');
    if (check.result === 'too_many_attempts') throw new AppError(429, 'otp_too_many_attempts');
    if (check.result === 'invalid') {
      throw new AppError(422, 'otp_invalid', [
        { field: 'code', code: `attempts_left:${check.attemptsLeft}` },
      ]);
    }

    const identity = await this.prisma.authIdentity.findUnique({
      where: { provider_providerSubject: { provider: 'email', providerSubject: email } },
      include: { user: true },
    });
    if (identity) return this.admit(identity.user);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      await this.prisma.authIdentity.create({
        data: { id: newId(), userId: existing.id, provider: 'email', providerSubject: email },
      });
      return this.admit(existing);
    }

    return this.prisma.user.create({
      data: {
        id: newId(),
        email,
        identities: { create: { id: newId(), provider: 'email', providerSubject: email } },
      },
    });
  }

  /** Google sign-in: links to an existing account with the same email. */
  async signInWithGoogle(claims: GoogleClaims): Promise<User> {
    const identity = await this.prisma.authIdentity.findUnique({
      where: { provider_providerSubject: { provider: 'google', providerSubject: claims.sub } },
      include: { user: true },
    });
    if (identity) return this.admit(identity.user);

    const existing = await this.prisma.user.findUnique({ where: { email: claims.email } });
    if (existing) {
      await this.prisma.authIdentity.create({
        data: { id: newId(), userId: existing.id, provider: 'google', providerSubject: claims.sub },
      });
      return this.admit(existing);
    }

    return this.prisma.user.create({
      data: {
        id: newId(),
        email: claims.email,
        // Name is prefilled from Google; the user confirms or edits it on the profile step.
        name: claims.name,
        identities: { create: { id: newId(), provider: 'google', providerSubject: claims.sub } },
      },
    });
  }

  async completeProfile(user: User, username: string, name: string): Promise<User> {
    if (user.username) throw new AppError(409, 'profile_already_completed');
    try {
      return await this.prisma.user.update({
        where: { id: user.id },
        data: { username, name, usernameChangedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(409, 'username_taken', [{ field: 'username', code: 'taken' }]);
      }
      throw error;
    }
  }

  /** Applies account status rules on sign-in. */
  private async admit(user: User): Promise<User> {
    if (user.status === 'deleted') throw new AppError(403, 'user_deleted');
    if (user.status === 'banned') {
      if (user.bannedUntil && user.bannedUntil.getTime() <= Date.now()) {
        return this.prisma.user.update({
          where: { id: user.id },
          data: { status: 'active', bannedUntil: null, banReason: null },
        });
      }
      throw new AppError(403, 'user_banned');
    }
    if (user.status === 'deactivated') {
      // Signing in again reactivates the account; listings stay hidden until the author returns them.
      return this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'active', deactivatedAt: null },
      });
    }
    return user;
  }
}
