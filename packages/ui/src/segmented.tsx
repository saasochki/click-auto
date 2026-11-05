import type { ChoiceOption } from './chip';
import { cn } from './cn';

/** Segmented control: one of a few equal options, e.g. the price currency. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-md bg-surface p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-10 flex-1 rounded-sm px-2 text-label whitespace-nowrap transition-colors',
            value === option.value
              ? 'bg-bg font-semibold text-text shadow-sm'
              : 'text-text-muted hover:text-text',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
