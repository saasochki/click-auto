import { describe, expect, it } from 'vitest';
import { validateAttributes, type AttributeDef } from './attributes';
import { nextStatus, publicVisibility } from './listing-rules';

const tires: AttributeDef[] = [
  { key: 'width', type: 'number', options: null, required: true },
  { key: 'season', type: 'enum', options: ['summer', 'winter', 'all_season'], required: true },
  { key: 'studded', type: 'bool', options: null, required: false },
];

describe('validateAttributes', () => {
  it('accepts valid values', () => {
    expect(validateAttributes(tires, { width: 205, season: 'summer', studded: false })).toEqual([]);
  });

  it('reports missing, invalid and unknown keys', () => {
    expect(validateAttributes(tires, { season: 'spring', color: 'red' })).toEqual([
      { field: 'goods.attributes.color', code: 'unknown' },
      { field: 'goods.attributes.width', code: 'required' },
      { field: 'goods.attributes.season', code: 'invalid' },
    ]);
  });
});

describe('listing status rules', () => {
  it('follows the state diagram', () => {
    expect(nextStatus('publish', 'draft')).toBe('active');
    expect(nextStatus('hide', 'active')).toBe('hidden');
    expect(nextStatus('unhide', 'hidden')).toBe('active');
    expect(nextStatus('remove', 'hidden')).toBe('removed');
    expect(nextStatus('publish', 'removed')).toBeNull();
    expect(nextStatus('unhide', 'blocked')).toBeNull();
  });

  it('answers 410 for hidden, removed and blocked cards', () => {
    expect(publicVisibility('active')).toBe('visible');
    expect(publicVisibility('hidden')).toBe('gone');
    expect(publicVisibility('blocked')).toBe('gone');
    expect(publicVisibility('draft')).toBe('missing');
  });
});
