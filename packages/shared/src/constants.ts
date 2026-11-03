/** Business limits. Source: docs/analytics/03-requirements.md and docs/backend/*. */

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_MAX_ATTEMPTS = 5;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_CHANGE_INTERVAL_DAYS = 30;

/** Reserved usernames: these and any username starting with them are not allowed. */
export const USERNAME_STOP_LIST = [
  'admin',
  'administrator',
  'moderator',
  'support',
  'help',
  'clickauto',
  'official',
  'api',
  'login',
  'signup',
  'settings',
  'root',
  'system',
] as const;

export const LISTING_PHOTOS_MAX = 20;
export const LISTING_DESCRIPTION_MAX = 3000;

export const PAGE_LIMIT_DEFAULT = 20;
export const PAGE_LIMIT_MAX = 50;

/** Staff sessions are not extended. */
export const STAFF_SESSION_HOURS = 12;
