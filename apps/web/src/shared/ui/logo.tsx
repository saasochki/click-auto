import { cn } from '@clickauto/ui';
import { Link } from '@/shared/i18n/routing';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('text-h2 font-bold whitespace-nowrap', className)}>
      Click<span className="text-accent-text">Auto</span>
    </Link>
  );
}
