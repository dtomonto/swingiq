'use client';

// ConfirmDialog — controlled confirmation modal for dangerous actions
// (delete, publish, toggle core flag, bulk ops). Supports an optional
// type-to-confirm phrase for the most destructive operations.

import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** When set, the confirm button stays disabled until this is typed. */
  requirePhrase?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  requirePhrase,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [phrase, setPhrase] = useState('');

  useEffect(() => {
    if (!open) setPhrase('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const blocked = Boolean(requirePhrase) && phrase.trim() !== requirePhrase;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button aria-label="Dismiss" className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {danger && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />}
            <h2 className="text-base font-semibold text-gray-100">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {description && <div className="mt-3 text-sm text-gray-400">{description}</div>}

        {requirePhrase && (
          <div className="mt-4">
            <label className="text-xs text-gray-500">
              Type <code className="rounded bg-gray-800 px-1 text-gray-300">{requirePhrase}</code> to confirm
            </label>
            <input
              // Intentional: move focus to the confirm-phrase input when this
              // destructive-action dialog opens (WCAG focus management).
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 outline-none focus:border-amber-500"
            />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={blocked}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
              danger
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-amber-500 text-gray-950 hover:bg-amber-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
