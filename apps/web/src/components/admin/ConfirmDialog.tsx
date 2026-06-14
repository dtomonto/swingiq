'use client';

// ConfirmDialog — controlled confirmation modal for dangerous actions
// (delete, publish, toggle core flag, bulk ops). Supports an optional
// type-to-confirm phrase for the most destructive operations.
//
// Built on the shared <Dialog> primitive (Radix), so focus-trap, ESC-to-close,
// scroll-lock, return-focus, and `aria-modal` come for free — this file just
// owns the confirm/cancel layout and the type-to-confirm gate. Public API is
// unchanged, so existing callers keep working.

import { useEffect, useId, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

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
  const descId = useId();
  const phraseId = useId();

  useEffect(() => {
    if (!open) setPhrase('');
  }, [open]);

  const blocked = Boolean(requirePhrase) && phrase.trim() !== requirePhrase;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Radix fires this on ESC / overlay-click / Close — treat any close as cancel.
        if (!next) onCancel();
      }}
    >
      {/* `description` is rendered as a div (it may be rich ReactNode), wired to
          the dialog via aria-describedby so we don't force it into a <p>. */}
      <DialogContent aria-describedby={description != null ? descId : undefined}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            {danger && (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error-text" aria-hidden="true" />
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description != null && (
            <div id={descId} className="text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </DialogHeader>

        {requirePhrase && (
          <div>
            <label htmlFor={phraseId} className="text-xs text-muted-foreground">
              Type <code className="rounded bg-muted px-1 text-foreground">{requirePhrase}</code> to
              confirm
            </label>
            <input
              id={phraseId}
              // Intentional: move focus to the confirm-phrase input when this
              // destructive-action dialog opens (WCAG focus management).
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:border-ring"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={blocked}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
