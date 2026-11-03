import { getTranslations } from 'next-intl/server';
import { CodeForm } from '@/features/auth/code-form';

export default async function CodePage() {
  const t = await getTranslations('auth.code');
  return (
    <>
      <h1 className="text-h1">{t('title')}</h1>
      <CodeForm />
    </>
  );
}
