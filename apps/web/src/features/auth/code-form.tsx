'use client';

import type { Locale } from '@clickauto/shared';
import { Button, OtpInput } from '@clickauto/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useStartEmailSignIn, useVerifyEmailSignIn } from '@/shared/api/generated/auth/auth';
import { getGetMeQueryKey } from '@/shared/api/generated/me/me';
import { useRouter } from '@/shared/i18n/routing';
import { clearLoginEmail, readLoginEmail } from '@/shared/lib/login-email';
import { errorKey, problemCode } from '@/shared/lib/problem';

const RESEND_SECONDS = 60;

export function CodeForm() {
  const t = useTranslations('auth.code');
  const te = useTranslations('errors');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<{ key: string; attemptsLeft?: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const verify = useVerifyEmailSignIn();
  const resend = useStartEmailSignIn();

  useEffect(() => {
    const saved = readLoginEmail();
    if (!saved) router.replace('/login');
    else setEmail(saved);
  }, [router]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const submit = (value: string) => {
    if (!email) return;
    setError(null);
    verify.mutate(
      { data: { email, code: value } },
      {
        onSuccess: async (res) => {
          if (res.status !== 200) return;
          clearLoginEmail();
          await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          router.replace(res.data.user.needsProfile ? '/signup/profile' : '/');
        },
        onError: (err) => {
          const left = problemCode(err, 'code')?.match(/^attempts_left:(\d+)$/)?.[1];
          setError({
            key: errorKey(problemCode(err)),
            attemptsLeft: left ? Number(left) : undefined,
          });
          setCode('');
        },
      },
    );
  };

  const resendCode = () => {
    if (!email) return;
    resend.mutate(
      { data: { email, locale } },
      {
        onSuccess: () => {
          setError(null);
          setSecondsLeft(RESEND_SECONDS);
        },
        onError: (err) => setError({ key: errorKey(problemCode(err)) }),
      },
    );
  };

  if (!email) return null;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body text-text-muted">{t('subtitle', { email })}</p>
      <OtpInput
        label={t('label')}
        value={code}
        onChange={setCode}
        onComplete={submit}
        error={Boolean(error)}
        disabled={verify.isPending}
      />
      {error ? (
        <p role="alert" className="text-caption text-danger">
          {te(error.key)}
          {error.attemptsLeft !== undefined
            ? ` · ${t('attemptsLeft', { count: error.attemptsLeft })}`
            : null}
        </p>
      ) : null}
      <Button
        kind="secondary"
        size="lg"
        fullWidth
        disabled={secondsLeft > 0 || resend.isPending}
        onClick={resendCode}
      >
        {secondsLeft > 0 ? t('resendIn', { seconds: secondsLeft }) : t('resend')}
      </Button>
      <Button kind="ghost" onClick={() => router.replace('/login')}>
        {t('changeEmail')}
      </Button>
    </div>
  );
}
