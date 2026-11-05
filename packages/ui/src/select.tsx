import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from './cn';
import { Field } from './field';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options?: readonly SelectOption[];
  /** Options in labelled groups (optgroup), e.g. cities by region. */
  groups?: readonly { label: string; options: readonly SelectOption[] }[];
  /** Text of the empty option. Without it the first option is selected. */
  placeholder?: string;
}

/** Native select styled as the design-system field: the phone shows its own picker. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options = [], groups = [], placeholder, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={selectId} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-13 w-full appearance-none rounded-md border bg-surface pr-10 pl-4 text-body text-text outline-none transition-colors',
            'focus:border-text disabled:opacity-50',
            error ? 'border-danger' : 'border-transparent',
          )}
          {...rest}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </Field>
  );
});
