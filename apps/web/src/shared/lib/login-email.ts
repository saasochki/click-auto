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
