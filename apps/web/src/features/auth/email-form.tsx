'use client';

import { emailSchema, type Locale } from '@clickauto/shared';
import { Button, Input } from '@clickauto/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useStartEmailSignIn } from '@/shared/api/generated/auth/auth';
import { API_URL } from '@/shared/config/env';
import { useRouter } from '@/shared/i18n/routing';
import { saveLoginEmail } from '@/shared/lib/login-email';
import { errorKey, problemCode } from '@/shared/lib/problem';

export function EmailForm() {
  const t = useTranslations('auth.login');
  const te = useTranslations('errors');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(() => {
    const fromGoogle = params.get('error');
    return fromGoogle ? errorKey(fromGoogle) : null;
  });
  const start = useStartEmailSignIn();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError('email_invalid');
      return;
    }
    setError(null);
    start.mutate(
      { data: { email: parsed.data, locale } },
      {
        onSuccess: () => {
          saveLoginEmail(parsed.data);
          router.push('/login/code');
        },
        onError: (err) => {
          const code = problemCode(err);
          // A code was sent recently: let the user enter it.
          if (code === 'otp_resend_too_soon') {
            saveLoginEmail(parsed.data);
            router.push('/login/code');
            return;
          }
          setError(errorKey(code));
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Input
        label={t('email')}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={error ? te(error) : undefined}
        autoFocus
      />
      <Button type="submit" size="lg" fullWidth disabled={start.isPending}>
        {t('submit')}
      </Button>
      <div className="flex items-center gap-3 text-caption text-text-muted">
        <span className="h-px flex-1 bg-border" />
        {t('or')}
        <span className="h-px flex-1 bg-border" />
      </div>
      <a
        href={`${API_URL}/api/v1/auth/google/start?locale=${locale}`}
        className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border border-border text-body font-semibold text-text hover:bg-surface"
      >
        <GoogleMark />
        {t('google')}
      </a>
      <p className="text-center text-caption text-text-muted">{t('terms')}</p>
    </form>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.2 3.3v2.75h3.55c2.08-1.92 3.25-4.74 3.25-8.08Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.55-2.76c-.99.66-2.25 1.06-3.73 1.06-2.87 0-5.3-1.94-6.17-4.54H2.16v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.83 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.16a11 11 0 0 0 0 9.9l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.35c1.62 0 3.07.56 4.21 1.65l3.15-3.15A10.55 10.55 0 0 0 12 1 11 11 0 0 0 2.16 7.05l3.67 2.84C6.7 7.29 9.13 5.35 12 5.35Z"
      />
    </svg>
  );
}
