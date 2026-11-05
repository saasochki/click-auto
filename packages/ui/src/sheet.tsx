'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from './cn';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Label of the close button for screen readers. */
  closeLabel: string;
  children: ReactNode;
  /** Sticky bottom area: "Сбросить" + "Показать 1 248", "Готово". */
  footer?: ReactNode;
  /** Almost full height on the phone (filters); otherwise as tall as the content. */
  tall?: boolean;
}

/**
 * Bottom sheet on the phone, centered dialog from md. Built on <dialog>: focus stays inside,
 * Esc and a tap on the dimmed area close it, the page under it does not scroll.
 */
export function Sheet({ open, onClose, title, closeLabel, children, footer, tall }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-overlay/45"
    >
      <div className="flex h-full flex-col justify-end md:items-center md:justify-center md:p-6">
        <button
          type="button"
          aria-label={closeLabel}
          tabIndex={-1}
          onClick={onClose}
          className="absolute inset-0 cursor-default"
        />
        <section
          className={cn(
            'relative flex max-h-full w-full flex-col rounded-t-xl bg-bg text-text md:max-w-lg md:rounded-xl',
            tall ? 'mt-12 flex-1 md:mt-0 md:max-h-full md:flex-none' : undefined,
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />
          <header className="flex shrink-0 items-center justify-between gap-4 px-4 pt-3 pb-2">
            <h2 className="text-h2">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="flex size-11 items-center justify-center rounded-full bg-surface text-text hover:bg-border"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
            {children}
          </div>
          {footer ? (
            <footer className="shrink-0 border-t border-border px-4 pt-3 pb-safe md:pb-4">
              {footer}
            </footer>
          ) : null}
        </section>
      </div>
    </dialog>
  );
}
