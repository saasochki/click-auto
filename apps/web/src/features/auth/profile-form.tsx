'use client';

import { personNameSchema, usernameSchema } from '@clickauto/shared';
import { Button, Input } from '@clickauto/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type FormEvent } from 'react';
import { useCompleteProfile } from '@/shared/api/generated/auth/auth';
import { getGetMeQueryKey, useGetMe } from '@/shared/api/generated/me/me';
import { useRouter } from '@/shared/i18n/routing';
import { errorKey, problemCode } from '@/shared/lib/problem';

export function ProfileForm() {
  const t = useTranslations('auth.profile');
  const te = useTranslations('errors');
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useGetMe({ query: { retry: false } });
  const complete = useCompleteProfile();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ username?: string; name?: string }>({});

  const user = me.data?.status === 200 ? me.data.data : null;

  useEffect(() => {
    if (me.isError) router.replace('/login');
    if (user && !user.needsProfile) router.replace('/');
    if (user?.name) setName((current) => current || (user.name ?? ''));
  }, [me.isError, user, router]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const u = usernameSchema.safeParse(username);
    const n = personNameSchema.safeParse(name);
    const next = {
      username: u.success ? undefined : u.error.issues[0]?.message,
      name: n.success ? undefined : 'name_required',
    };
    setErrors(next);
    if (!u.success || !n.success) return;

    complete.mutate(
      { data: { username: u.data, name: n.data } },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          router.replace('/');
        },
        onError: (err) => {
          const code = problemCode(err);
          const field = problemCode(err, 'username');
          setErrors({ username: errorKey(code === 'validation_failed' ? field : code) });
        },
      },
    );
  };

  if (!user) return null;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Input
        label={t('username')}
        prefix="@"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={username}
        onChange={(event) => setUsername(event.target.value.toLowerCase())}
        hint={t('usernameHint')}
        error={errors.username ? te(errorKey(errors.username)) : undefined}
        autoFocus
      />
      <Input
        label={t('name')}
        autoComplete="given-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name ? te(errors.name) : undefined}
      />
      <Button type="submit" size="lg" fullWidth disabled={complete.isPending}>
        {t('submit')}
      </Button>
    </form>
  );
}
