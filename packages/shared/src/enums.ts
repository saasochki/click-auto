/**
 * Enum values shared by API, site and admin.
 * Source of truth: docs/analytics/08-dictionaries.md, docs/analytics/05-filters.md,
 * docs/backend/03-domain-model.md. Labels live in i18n dictionaries, not here.
 */

export const LOCALES = ['ru', 'ro'] as const;
export type Locale = (typeof LOCALES)[number];

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

export const USER_ROLES = ['user', 'moderator', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'deactivated', 'banned', 'deleted'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** `PRB` is the internal code of the PMR ruble. */
export const CURRENCIES = ['MDL', 'PRB', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const LISTING_TYPES = ['car', 'goods', 'service'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_STATUSES = ['draft', 'active', 'hidden', 'removed', 'blocked'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LISTING_ORIGINS = ['native', 'imported'] as const;
export type ListingOrigin = (typeof LISTING_ORIGINS)[number];

export const TRANSMISSIONS = ['manual', 'automatic', 'robot', 'cvt'] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

export const DRIVES = ['fwd', 'rwd', 'awd'] as const;
export type Drive = (typeof DRIVES)[number];

export const BODY_TYPES = [
  'sedan',
  'hatchback',
  'wagon',
  'liftback',
  'coupe',
  'convertible',
  'suv',
  'crossover',
  'minivan',
  'pickup',
  'van',
  'minibus',
] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const COLORS = [
  'white',
  'black',
  'gray',
  'silver',
  'blue',
  'light_blue',
  'red',
  'burgundy',
  'green',
  'beige',
  'brown',
  'yellow',
  'orange',
  'purple',
  'gold',
  'other',
] as const;
export type Color = (typeof COLORS)[number];

export const FUEL_TYPES = [
  'petrol',
  'cng',
  'lpg',
  'diesel',
  'hybrid',
  'plugin_hybrid',
  'electric',
] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const STEERINGS = ['left', 'right'] as const;
export type Steering = (typeof STEERINGS)[number];

export const REGISTRATIONS = ['pmr', 'md', 'neutral', 'foreign'] as const;
export type Registration = (typeof REGISTRATIONS)[number];

export const CAR_CONDITIONS = ['new', 'used', 'needs_repair'] as const;
export type CarCondition = (typeof CAR_CONDITIONS)[number];

export const GOODS_CONDITIONS = ['new', 'used'] as const;
export type GoodsCondition = (typeof GOODS_CONDITIONS)[number];

export const COUNTRIES = ['pmr', 'md'] as const;
export type Country = (typeof COUNTRIES)[number];

export const CATEGORY_KINDS = ['goods', 'service'] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const ATTRIBUTE_TYPES = ['number', 'range', 'enum', 'multi_enum', 'bool', 'text'] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export const REPORT_TARGETS = ['listing', 'message', 'user'] as const;
export type ReportTarget = (typeof REPORT_TARGETS)[number];

export const REPORT_REASONS = {
  listing: ['fraud', 'wrong_info', 'sold', 'photos_mismatch', 'duplicate', 'other'],
  message: ['spam', 'fraud', 'abuse', 'other'],
  user: ['impersonation', 'spam', 'fraud', 'other'],
} as const satisfies Record<ReportTarget, readonly string[]>;
export type ReportReason = (typeof REPORT_REASONS)[ReportTarget][number];

export const REPORT_STATUSES = ['new', 'resolved', 'rejected'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_RESOLUTIONS = ['listing_blocked', 'user_banned', 'rejected'] as const;
export type ReportResolution = (typeof REPORT_RESOLUTIONS)[number];

/** Ban durations in days; `null` means permanent. */
export const BAN_DURATIONS_DAYS = [1, 7, 30, null] as const;

export const IMPORT_SOURCES = ['999md', 'makler', 'klaxon'] as const;
export type ImportSourceCode = (typeof IMPORT_SOURCES)[number];

export const MATCH_STATUSES = ['matched', 'needs_review', 'duplicate'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const SORTS = ['date_desc', 'price_asc', 'price_desc', 'mileage_asc', 'year_desc'] as const;
export type Sort = (typeof SORTS)[number];
