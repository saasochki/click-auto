import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label?: ReactNode;
  hint?: ReactNode;
  /** Error text. Shown instead of the hint, together with the error style. */
  error?: ReactNode;
  prefix?: ReactNode;
}

/** Text field from the design system: label above, hint or error below. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, prefix, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  const note = error ?? hint;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={inputId} className="text-label text-text">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          'flex h-13 items-center gap-2 rounded-md border bg-surface px-4 transition-colors',
          'focus-within:border-text',
          error ? 'border-danger' : 'border-transparent',
          rest.disabled && 'opacity-50',
        )}
      >
        {prefix ? <span className="text-body text-text-muted">{prefix}</span> : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className="h-full w-full min-w-0 bg-transparent text-body text-text outline-none placeholder:text-text-muted"
          {...rest}
        />
      </div>
      {note ? (
        <p id={noteId} className={cn('text-caption', error ? 'text-danger' : 'text-text-muted')}>
          {note}
        </p>
      ) : null}
    </div>
  );
});
