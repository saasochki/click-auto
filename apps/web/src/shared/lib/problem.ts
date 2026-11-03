import { ApiError } from '@/shared/api/http-client';

/** i18n keys under `errors.*` that have a translation. Unknown codes fall back to unknown_error. */
const KNOWN = new Set([
  'otp_invalid',
  'otp_expired',
  'otp_too_many_attempts',
  'otp_resend_too_soon',
  'rate_limited',
  'user_banned',
  'username_length',
  'username_charset',
  'username_start',
  'username_reserved',
  'username_taken',
  'email_invalid',
  'name_required',
  'google',
  'banned',
]);

export function errorKey(code: string | undefined): string {
  return code && KNOWN.has(code) ? code : 'unknown_error';
}

/** Stable error code of an API error, or of a field inside it. */
export function problemCode(error: unknown, field?: string): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  if (field) return error.problem.errors?.find((item) => item.field === field)?.code;
  return error.problem.code;
}
