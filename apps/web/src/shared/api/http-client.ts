import { API_URL } from '@/shared/config/env';

/**
 * orval mutator: every generated request goes through here. Sends cookies, parses
 * Problem Details into ApiError. Do not call fetch directly from features.
 */

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string | null;
  errors?: { field: string; code: string }[];
}

export class ApiError extends Error {
  constructor(readonly problem: ProblemDetails) {
    super(problem.code);
  }
}

/**
 * Dictionaries come localized by Accept-Language. In the browser it follows the site locale
 * (`<html lang>`), not the browser settings; on the server the page passes it explicitly.
 */
function withLocale(init: RequestInit): RequestInit {
  if (typeof document === 'undefined') return init;
  const headers = new Headers(init.headers);
  if (!headers.has('accept-language'))
    headers.set('accept-language', document.documentElement.lang || 'ru');
  return { ...init, headers };
}

export async function httpClient<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, { credentials: 'include', ...withLocale(init) });
  const isJson = response.headers.get('content-type')?.includes('json') ?? false;
  const body: unknown = isJson ? await response.json() : null;
  if (!response.ok) {
    throw new ApiError(
      (body as ProblemDetails | null) ?? {
        type: 'about:blank',
        title: response.statusText,
        status: response.status,
        code: 'unknown_error',
        detail: null,
      },
    );
  }
  return { data: body, status: response.status, headers: response.headers } as T;
}

export default httpClient;
