import type { ReactNode } from 'react';
import { cn } from './cn';

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Text on the right of the label, e.g. a counter "3 из 20". */
  aside?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

/** Label, control and hint/error: the frame shared by every form control. */
export function Field({ label, hint, error, aside, htmlFor, className, children }: FieldProps) {
  const note = error ?? hint;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label || aside ? (
        <div className="flex items-baseline justify-between gap-2">
          {label ? (
            <label htmlFor={htmlFor} className="text-label text-text">
              {label}
            </label>
          ) : (
            <span />
          )}
          {aside ? <span className="text-caption text-text-muted">{aside}</span> : null}
        </div>
      ) : null}
      {children}
      {note ? (
        <p className={cn('text-caption', error ? 'text-danger' : 'text-text-muted')}>{note}</p>
      ) : null}
    </div>
  );
}
