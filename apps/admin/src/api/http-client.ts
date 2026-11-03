/** orval mutator for the admin. Sends the staff session cookie, parses Problem Details. */

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

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

export async function httpClient<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, { credentials: 'include', ...init });
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
