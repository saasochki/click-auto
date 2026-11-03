import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export type ButtonKind = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  size?: ButtonSize;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const kinds: Record<ButtonKind, string> = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent-hover',
  secondary: 'bg-surface text-text hover:bg-border',
  outline: 'border border-border bg-transparent text-text hover:bg-surface',
  ghost: 'bg-transparent text-text hover:bg-surface',
  danger: 'border border-border bg-transparent text-danger hover:bg-danger-subtle',
};

const sizes: Record<ButtonSize, string> = {
  lg: 'h-14 rounded-lg px-5 text-body font-semibold',
  md: 'h-12 rounded-lg px-4 text-body font-semibold',
  sm: 'h-9 rounded-md px-3 text-label',
};

/** Button from the design system. Primary — one per screen. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { kind = 'primary', size = 'md', icon, fullWidth, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        kinds[kind],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});
