import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/** Only cache tags of listings can be dropped: listing:<uuid>. */
const TAG = /^listing:[0-9a-f-]{36}$/;
const MAX_TAGS = 200;

function sameSecret(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Called by the worker after a listing changes (docs/frontend/02-architecture.md, "Данные"):
 * drops the cached public card. Protected by REVALIDATE_SECRET; without it the route is off.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ code: 'disabled' }, { status: 404 });
  if (!sameSecret(request.headers.get('x-revalidate-secret'), secret)) {
    return NextResponse.json({ code: 'forbidden' }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags : [];
  const valid = tags.filter((tag): tag is string => typeof tag === 'string' && TAG.test(tag));
  if (valid.length === 0 || valid.length > MAX_TAGS) {
    return NextResponse.json({ code: 'bad_tags' }, { status: 422 });
  }
  for (const tag of valid) revalidateTag(tag);
  return NextResponse.json({ revalidated: valid.length });
}
