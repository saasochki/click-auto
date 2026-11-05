import { useId, type ReactNode } from 'react';
import { cn } from './cn';

/** On/off switch with the label on the left, like "Возможен обмен" in the design. */
export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <label htmlFor={id} className="text-body text-text">
          {label}
        </label>
        {hint ? <span className="text-caption text-text-muted">{hint}</span> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          checked ? 'bg-accent' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  );
}

/** Checkbox with the label on the right, like "Договорная". */
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-body text-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 shrink-0 cursor-pointer rounded-sm accent-accent"
      />
      {label}
    </label>
  );
}
