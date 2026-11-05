/** The email between the login and code steps lives in sessionStorage, never in the URL. */
const KEY = 'ca_login_email';

export function saveLoginEmail(email: string): void {
  try {
    sessionStorage.setItem(KEY, email);
  } catch {
    // Private mode: the code step will send the user back to the email step.
  }
}

export function readLoginEmail(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearLoginEmail(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

const RETURN_KEY = 'ca_login_return';

/** Where to go after sign-in: only an in-site path ("/me/listings"), never another host. */
export function saveReturnPath(path: string | null): void {
  try {
    if (path && path.startsWith('/') && !path.startsWith('//'))
      sessionStorage.setItem(RETURN_KEY, path);
    else sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // ignore
  }
}

export function takeReturnPath(): string {
  try {
    const path = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    return path ?? '/';
  } catch {
    return '/';
  }
}
