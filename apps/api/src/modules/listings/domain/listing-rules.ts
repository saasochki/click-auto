import type { ListingStatus } from '@clickauto/shared';

/**
 * Owner actions and allowed status transitions.
 * Docs: docs/backend/03-domain-model.md (state diagram). Blocking is done only by moderation.
 */
export const LISTING_ACTIONS = ['publish', 'hide', 'unhide', 'remove'] as const;
export type ListingAction = (typeof LISTING_ACTIONS)[number];

const TRANSITIONS: Record<ListingAction, { from: readonly ListingStatus[]; to: ListingStatus }> = {
  publish: { from: ['draft'], to: 'active' },
  hide: { from: ['active'], to: 'hidden' },
  unhide: { from: ['hidden'], to: 'active' },
  remove: { from: ['draft', 'active', 'hidden'], to: 'removed' },
};

export function nextStatus(action: ListingAction, current: ListingStatus): ListingStatus | null {
  const rule = TRANSITIONS[action];
  return rule.from.includes(current) ? rule.to : null;
}

/** Statuses in which the owner may still edit the listing. */
export const EDITABLE_STATUSES: readonly ListingStatus[] = ['draft', 'active', 'hidden'];

/** Public card: active is shown; hidden, removed and blocked answer 410; drafts do not exist publicly. */
export function publicVisibility(status: ListingStatus): 'visible' | 'gone' | 'missing' {
  if (status === 'active') return 'visible';
  if (status === 'draft') return 'missing';
  return 'gone';
}

/** "Марка Модель, год" — or "Марка Модель-текстом, год" for model «Другая». */
export function carTitle(brand: string, model: string, year: number): string {
  return `${brand} ${model}, ${year}`;
}
