import { createFileRoute } from '@tanstack/react-router';
import { createT } from '@/i18n';

const t = createT('ru');

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function Dashboard() {
  return (
    <main className="p-6">
      <p className="text-h2 font-bold">
        Click<span className="text-accent-text">Auto</span>
      </p>
      <h1 className="mt-6 text-h1">{t('dashboard.title')}</h1>
      <p className="mt-2 text-label text-text-muted">{t('dashboard.empty')}</p>
    </main>
  );
}
