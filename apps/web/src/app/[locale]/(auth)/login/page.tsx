import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { EmailForm } from '@/features/auth/email-form';

export default async function LoginPage() {
  const t = await getTranslations('auth.login');
  return (
    <>
      <div>
        <h1 className="text-h1">{t('title')}</h1>
        <p className="mt-2 text-body text-text-muted">{t('subtitle')}</p>
      </div>
      <Suspense>
        <EmailForm />
      </Suspense>
    </>
  );
}
