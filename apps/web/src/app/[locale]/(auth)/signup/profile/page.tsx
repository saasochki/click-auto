import { getTranslations } from 'next-intl/server';
import { ProfileForm } from '@/features/auth/profile-form';

export default async function SignupProfilePage() {
  const t = await getTranslations('auth.profile');
  return (
    <>
      <div>
        <h1 className="text-h1">{t('title')}</h1>
        <p className="mt-2 text-body text-text-muted">{t('subtitle')}</p>
      </div>
      <ProfileForm />
    </>
  );
}
