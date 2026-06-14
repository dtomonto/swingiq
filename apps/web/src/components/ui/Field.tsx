'use client';

// Field — the label + control + hint/error wrapper that makes a form row
// accessible by default. It generates one id and wires it across the label
// (<Label htmlFor>), the control (id), and the hint/error (aria-describedby),
// and flips aria-invalid on the control when there's an error — so callers stop
// re-implementing that wiring on every raw <input>.
//
//   <Field label="Email" error={errors.email}>
//     <Input type="email" />
//   </Field>

import * as LabelPrimitive from '@radix-ui/react-label';
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ControlProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  required?: boolean;
};

interface FieldProps {
  label: ReactNode;
  /** Helper text shown when there's no error. */
  hint?: ReactNode;
  /** Error message; also flips the control's aria-invalid. */
  error?: ReactNode;
  required?: boolean;
  className?: string;
  /** A single form control (Input, Textarea, Select trigger, …). */
  children: ReactElement<ControlProps>;
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const autoId = useId();
  const controlId = children.props.id ?? autoId;
  const hintId = `${autoId}-hint`;
  const errorId = `${autoId}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required: children.props.required ?? required,
      })
    : children;

  return (
    <div className={cn('space-y-1.5', className)}>
      <LabelPrimitive.Root
        htmlFor={controlId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-error-text" aria-hidden="true">
            *
          </span>
        )}
      </LabelPrimitive.Root>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-error-text">
          {error}
        </p>
      )}
    </div>
  );
}
