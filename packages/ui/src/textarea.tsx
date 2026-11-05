import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';
import { Field } from './field';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

/** Multi-line field. With maxLength it shows the counter "118 / 3000" under the field. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, maxLength, value, rows = 5, ...rest },
  ref,
) {
  const autoId = useId();
  const areaId = id ?? autoId;
  const length = typeof value === 'string' ? value.length : 0;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={areaId} className={className}>
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full resize-y rounded-md border bg-surface px-4 py-3 text-body text-text outline-none transition-colors placeholder:text-text-muted',
          'focus:border-text',
          error ? 'border-danger' : 'border-transparent',
        )}
        {...rest}
      />
      {maxLength ? (
        <p className="text-right text-caption text-text-muted">
          {length} / {maxLength}
        </p>
      ) : null}
    </Field>
  );
});
