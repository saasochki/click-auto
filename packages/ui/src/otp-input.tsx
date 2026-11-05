'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from './cn';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called once all cells are filled. */
  onComplete?: (value: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  label: string;
}

/** Six cells for a one-time code. Paste from the clipboard fills all cells. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  error,
  disabled,
  label,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const update = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    refs.current[Math.min(clean.length, length - 1)]?.focus();
  };

  const onInput = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = digits.slice();
    chars[index] = digit;
    update(chars.join(''));
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      const chars = digits.slice();
      chars[index - 1] = '';
      onChange(chars.join(''));
      refs.current[index - 1]?.focus();
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    update(event.clipboardData.getData('text'));
  };

  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          aria-label={`${label} ${index + 1}`}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onInput(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
          className={cn(
            'h-14 w-12 rounded-md border bg-surface text-center text-h1 text-text outline-none transition-colors',
            'focus:border-text',
            error ? 'border-danger' : 'border-transparent',
          )}
        />
      ))}
    </div>
  );
}
