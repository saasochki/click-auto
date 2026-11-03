import {
  createParamDecorator,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Session, User } from '@clickauto/db';
import type { Request } from 'express';
import { AppError } from '../../common/problem';
import { SESSION_COOKIE, SessionService } from './session.service';

export interface AuthContext {
  user: User;
  session: Session;
}

export type AuthedRequest = Request & { auth?: AuthContext };

/** Requires a valid session of an active (or not yet onboarded) user. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const cookies = req.cookies as Record<string, string | undefined>;
    const resolved = await this.sessions.resolve(cookies[SESSION_COOKIE]);
    if (!resolved) throw new AppError(401, 'unauthorized');
    if (resolved.user.status === 'banned' || resolved.user.status === 'deleted') {
      throw new AppError(403, 'user_banned');
    }
    req.auth = resolved;
    return true;
  }
}

/** Same as SessionGuard, but the profile (username + name) must be completed. */
@Injectable()
export class RegisteredGuard extends SessionGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.auth?.user.username || !req.auth.user.name) {
      throw new AppError(403, 'profile_incomplete');
    }
    return true;
  }
}

export const CurrentAuth = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  if (!req.auth) throw new AppError(401, 'unauthorized');
  return req.auth;
});
