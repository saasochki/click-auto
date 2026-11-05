import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  size?: 'md' | 'sm';
}

/** Chip: a choice in a group, a quick filter, a status tab. */
export function Chip({ selected, size = 'md', className, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 whitespace-nowrap transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50',
        size === 'md' ? 'h-10 text-label' : 'h-8 text-caption',
        selected ? 'bg-text text-bg' : 'bg-surface text-text hover:bg-border',
        className,
      )}
      {...rest}
    />
  );
}

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

/** Single choice from chips. */
export function ChipChoice<T extends string>({
  options,
  value,
  onChange,
  allowEmpty,
}: {
  options: readonly ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  /** Tapping the selected chip clears the choice. */
  allowEmpty?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={value === option.value}
          onClick={() => onChange(allowEmpty && value === option.value ? null : option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

/** Several choices from chips. */
export function ChipMulti<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly ChoiceOption<T>[];
  value: readonly T[];
  onChange: (value: T[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Chip
            key={option.value}
            selected={selected}
            onClick={() =>
              onChange(
                selected ? value.filter((item) => item !== option.value) : [...value, option.value],
              )
            }
          >
            {option.label}
          </Chip>
        );
      })}
    </div>
  );
}
