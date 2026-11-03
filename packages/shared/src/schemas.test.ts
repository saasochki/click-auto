import { describe, expect, it } from 'vitest';
import { parseMajorToMinor } from './money';
import { usernameSchema } from './schemas';

describe('usernameSchema', () => {
  it.each(['ivan_auto', 'abc', 'a1_b2'])('accepts %s', (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(true);
  });

  it('lowercases input', () => {
    expect(usernameSchema.parse('Ivan_Auto')).toBe('ivan_auto');
  });

  it.each([
    ['ab', 'username_length'],
    ['a'.repeat(31), 'username_length'],
    ['1abc', 'username_start'],
    ['ivan-auto', 'username_charset'],
    ['ivan_', 'username_charset'],
    ['iv__an', 'username_charset'],
    ['admin', 'username_reserved'],
    ['support_team', 'username_reserved'],
  ])('rejects %s with %s', (value, code) => {
    const result = usernameSchema.safeParse(value);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(code);
  });
});

describe('parseMajorToMinor', () => {
  it('parses integer and decimal amounts', () => {
    expect(parseMajorToMinor('15 900', 'USD')).toBe(1_590_000);
    expect(parseMajorToMinor('12,5', 'EUR')).toBe(1250);
  });

  it('rejects invalid input', () => {
    expect(parseMajorToMinor('abc', 'USD')).toBeNull();
    expect(parseMajorToMinor('1.234', 'USD')).toBeNull();
  });
});
