import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { LOCALES, localeSchema, type Locale } from '@clickauto/shared';
import type { Request, Response } from 'express';
import { clientIp } from '../../common/client-ip';
import { AppError, Problem } from '../../common/problem';
import { ENV } from '../../config/config.module';
import type { Env } from '../../config/env';
import { CurrentAuth, SessionGuard, type AuthContext } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthResultDto, CompleteProfileDto, EmailStartDto, EmailVerifyDto, MeDto } from './dto';
import { GoogleService } from './google.service';
import { SessionService } from './session.service';
import { toMe } from './user.mapper';

const OAUTH_STATE_COOKIE = 'ca_oauth_state';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly google: GoogleService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post('email/start')
  @HttpCode(204)
  @ApiOperation({ operationId: 'startEmailSignIn', summary: 'Send a one-time code to the email' })
  @ApiNoContentResponse()
  @ApiUnprocessableEntityResponse({ type: Problem })
  @ApiTooManyRequestsResponse({
    type: Problem,
    description: 'Resend cooldown or IP limit; see Retry-After',
  })
  async startEmail(@Body() body: EmailStartDto, @Req() req: Request): Promise<void> {
    await this.auth.startEmail(body.email, body.locale, clientIp(req));
  }

  @Post('email/verify')
  @HttpCode(200)
  @ApiOperation({ operationId: 'verifyEmailSignIn', summary: 'Check the code and start a session' })
  @ApiOkResponse({ type: AuthResultDto })
  @ApiUnprocessableEntityResponse({ type: Problem, description: 'otp_invalid or otp_expired' })
  @ApiTooManyRequestsResponse({ type: Problem, description: 'otp_too_many_attempts' })
  @ApiResponse({ status: 403, type: Problem, description: 'user_banned' })
  async verifyEmail(
    @Body() body: EmailVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResultDto> {
    const user = await this.auth.verifyEmail(body.email, body.code);
    const { token, expiresAt } = await this.sessions.create(user, {
      userAgent: req.headers['user-agent'],
      ip: clientIp(req),
    });
    this.sessions.setCookie(res, token, expiresAt);
    return { user: toMe(user) };
  }

  @Get('google/start')
  @ApiOperation({ operationId: 'startGoogleSignIn', summary: 'Redirect to Google' })
  @ApiQuery({ name: 'locale', enum: LOCALES, required: false })
  @ApiFoundResponse({ description: 'Redirect to Google' })
  @ApiResponse({ status: 503, type: Problem, description: 'google_disabled' })
  async startGoogle(
    @Query('locale') localeRaw: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const locale: Locale = localeSchema.catch('ru').parse(localeRaw);
    const { url, state } = await this.google.start(locale);
    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: this.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/api/v1/auth/google',
    });
    res.redirect(302, url);
  }

  @Get('google/callback')
  @ApiOperation({ operationId: 'finishGoogleSignIn', summary: 'Google redirects back here' })
  @ApiFoundResponse({ description: 'Redirect to the site' })
  async finishGoogle(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const cookies = req.cookies as Record<string, string | undefined>;
    const expectedState = cookies[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/api/v1/auth/google' });
    if (!code || !state || state !== expectedState) {
      res.redirect(302, `${this.env.WEB_URL}/ru/login?error=google`);
      return;
    }
    try {
      const { claims, locale } = await this.google.finish(code, state);
      const user = await this.auth.signInWithGoogle(claims);
      const session = await this.sessions.create(user, {
        userAgent: req.headers['user-agent'],
        ip: clientIp(req),
      });
      this.sessions.setCookie(res, session.token, session.expiresAt);
      const next = toMe(user).needsProfile ? `/${locale}/signup/profile` : `/${locale}`;
      res.redirect(302, `${this.env.WEB_URL}${next}`);
    } catch (error) {
      const reason =
        error instanceof AppError && error.code === 'user_banned' ? 'banned' : 'google';
      res.redirect(302, `${this.env.WEB_URL}/ru/login?error=${reason}`);
    }
  }

  @Post('complete-profile')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({
    operationId: 'completeProfile',
    summary: 'Choose username and name after sign-up',
  })
  @ApiOkResponse({ type: MeDto })
  @ApiConflictResponse({ type: Problem, description: 'username_taken' })
  @ApiUnprocessableEntityResponse({ type: Problem })
  @ApiUnauthorizedResponse({ type: Problem })
  async completeProfile(
    @Body() body: CompleteProfileDto,
    @CurrentAuth() auth: AuthContext,
  ): Promise<MeDto> {
    return toMe(await this.auth.completeProfile(auth.user, body.username, body.name));
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ operationId: 'logout', summary: 'End the current session' })
  @ApiNoContentResponse()
  async logout(
    @CurrentAuth() auth: AuthContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.sessions.revoke(auth.session.id);
    this.sessions.clearCookie(res);
  }
}
