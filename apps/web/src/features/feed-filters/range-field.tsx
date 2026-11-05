'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';
import { formatNumber } from '@/shared/lib/format';

function digits(value: string): number | null {
  const clean = value.replace(/\D/g, '');
  if (!clean) return null;
  const parsed = Number(clean);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** One number box that commits on blur or Enter: the sidebar does not reload on every key. */
export function NumberBox({
  value,
  onCommit,
  placeholder,
  label,
  locale,
}: {
  value: number | null;
  onCommit: (value: number | null) => void;
  placeholder: string;
  label: string;
  locale: string;
}) {
  const show = (v: number | null) => (v === null ? '' : formatNumber(v, locale));
  const [text, setText] = useState(show(value));
  // Follow the value when it changes from outside (reset, chip removed).
  useEffect(() => setText(value === null ? '' : formatNumber(value, locale)), [value, locale]);

  const commit = () => {
    const next = digits(text);
    if (next !== value) onCommit(next);
    setText(show(next));
  };
  return (
    <input
      inputMode="numeric"
      aria-label={label}
      value={text}
      placeholder={placeholder}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
      }}
      className="h-13 w-full min-w-0 rounded-md bg-surface px-4 text-body text-text outline-none placeholder:text-text-muted focus:ring-2 focus:ring-text"
    />
  );
}

/** "Год выпуска: 2015 — 2020", "Цена: от — до". */
export function RangeField({
  label,
  from,
  to,
  onChange,
  locale,
  children,
}: {
  label: ReactNode;
  from: number | null;
  to: number | null;
  onChange: (from: number | null, to: number | null) => void;
  locale: string;
  /** Extra controls under the boxes: currency, "Договорная". */
  children?: ReactNode;
}) {
  const t = useTranslations('filters');
  const name = typeof label === 'string' ? label : '';
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-label">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <NumberBox
          value={from}
          onCommit={(value) => onChange(value, to)}
          placeholder={t('from')}
          label={`${name} ${t('from')}`}
          locale={locale}
        />
        <NumberBox
          value={to}
          onCommit={(value) => onChange(from, value)}
          placeholder={t('to')}
          label={`${name} ${t('to')}`}
          locale={locale}
        />
      </div>
      {children}
    </fieldset>
  );
}
