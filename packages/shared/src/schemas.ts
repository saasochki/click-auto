import { z } from 'zod';
import { OTP_LENGTH, USERNAME_MAX, USERNAME_MIN, USERNAME_STOP_LIST } from './constants';
import { CURRENCIES, LOCALES, THEMES } from './enums';

/** Validation error codes for username; the site maps them to i18n keys. */
export const USERNAME_ERRORS = {
  length: 'username_length',
  charset: 'username_charset',
  start: 'username_start',
  reserved: 'username_reserved',
} as const;

export const normalizeUsername = (value: string): string => value.trim().toLowerCase();

export function isReservedUsername(username: string): boolean {
  return USERNAME_STOP_LIST.some((word) => username.startsWith(word));
}

export const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .superRefine((value, ctx) => {
    if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: USERNAME_ERRORS.length });
      return;
    }
    if (!/^[a-z0-9_]+$/.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: USERNAME_ERRORS.charset });
      return;
    }
    if (!/^[a-z]/.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: USERNAME_ERRORS.start });
      return;
    }
    if (value.endsWith('_') || value.includes('__')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: USERNAME_ERRORS.charset });
      return;
    }
    if (isReservedUsername(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: USERNAME_ERRORS.reserved });
    }
  });

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`));

/** Display name. Required; the length cap is a technical limit, not a product rule. */
export const personNameSchema = z.string().trim().min(1).max(100);

/** Contact phone in E.164, not verified. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/);

export const localeSchema = z.enum(LOCALES);
export const themeSchema = z.enum(THEMES);
export const currencySchema = z.enum(CURRENCIES);

export const moneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: currencySchema,
});

export const emailStartSchema = z.object({ email: emailSchema });
export const emailVerifySchema = z.object({ email: emailSchema, code: otpCodeSchema });
export const completeProfileSchema = z.object({ username: usernameSchema, name: personNameSchema });
