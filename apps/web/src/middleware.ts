import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './shared/i18n/routing';

const intl = createMiddleware(routing);

/** Session cookie set by the API (httpOnly): only its presence is checked here. */
const SESSION_COOKIE = 'ca_session';
const ACCOUNT_PATH = /^\/(ru|ro)\/(me|chat)(\/|$)/;

export default function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const match = ACCOUNT_PATH.exec(pathname);
  if (match && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${match[1]}/login`;
    url.search = `?next=${encodeURIComponent(pathname.replace(/^\/(ru|ro)/, '') + search)}`;
    return NextResponse.redirect(url);
  }
  return intl(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
