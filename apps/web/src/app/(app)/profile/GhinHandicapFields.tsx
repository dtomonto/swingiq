'use client';

import { useState } from 'react';
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { z } from 'zod';
import { GolferProfileSchema } from '@swingiq/core';
import { CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { formatHandicapIndex, isValidGhinNumber } from '@/lib/ghin/validate';

type FormValues = z.input<typeof GolferProfileSchema>;

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

/**
 * Handicap + GHIN block for the golf profile.
 *
 * Keyless-first: the golfer can always type a Handicap Index and GHIN number by
 * hand (stored as self-reported). When the operator has configured live GHIN
 * credentials, "Verify with GHIN" pulls the official Handicap Index and marks
 * it platform-verified. Nothing is ever fabricated — an unconfigured lookup
 * simply keeps the self-reported value.
 */
export function GhinHandicapFields({
  register,
  setValue,
  watch,
}: {
  register: UseFormRegister<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  watch: UseFormWatch<FormValues>;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'verified' | 'manual' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const ghinNumber = watch('ghin_number') ?? '';
  const source = watch('handicap_source') ?? 'self_reported';
  const verifiedAt = watch('handicap_verified_at');
  const handicap = watch('handicap');

  const handicapReg = register('handicap', { valueAsNumber: true });

  // Any manual edit to the handicap demotes it back to self-reported so the
  // "Verified via GHIN" badge can never sit on a hand-edited number.
  const onHandicapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handicapReg.onChange(e);
    setValue('handicap_source', 'self_reported');
    setValue('handicap_verified_at', null);
    if (status === 'verified') setStatus('idle');
  };

  const verify = async () => {
    if (!isValidGhinNumber(String(ghinNumber))) {
      setStatus('error');
      setMessage('Enter a valid 6–10 digit GHIN number first.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/ghin/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghinNumber: String(ghinNumber) }),
      });
      const data = await res.json();

      if (data.ok && data.configured === false) {
        setStatus('manual');
        setMessage(data.message ?? 'Live GHIN lookup is not enabled — saved as self-reported.');
        return;
      }
      if (!data.ok || typeof data.handicapIndex !== 'number') {
        setStatus('error');
        setMessage(data.error ?? 'Could not verify with GHIN. Try again later.');
        return;
      }

      setValue('handicap', data.handicapIndex, { shouldValidate: true, shouldDirty: true });
      setValue('handicap_source', 'ghin_verified');
      setValue('handicap_verified_at', new Date().toISOString());
      setStatus('verified');
      const who = typeof data.fullName === 'string' && data.fullName ? ` for ${data.fullName}` : '';
      setMessage(`Handicap Index ${formatHandicapIndex(data.handicapIndex)} verified via GHIN${who}.`);
    } catch {
      setStatus('error');
      setMessage('Could not reach GHIN. Check your connection and try again.');
    }
  };

  const isVerified = source === 'ghin_verified';

  return (
    <>
      <Field label="Handicap" hint="Your current Handicap Index, or your best estimate.">
        <div className="flex items-center gap-2">
          <input
            {...handicapReg}
            onChange={onHandicapChange}
            type="number"
            step="0.1"
            className={inputClass}
            placeholder="12.4"
          />
          {isVerified && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              title={verifiedAt ? `Verified ${new Date(verifiedAt).toLocaleDateString()}` : 'Verified via GHIN'}
            >
              <ShieldCheck size={13} /> GHIN
            </span>
          )}
        </div>
      </Field>

      <Field
        label="GHIN Number"
        hint="Optional. Your USGA/GHIN id — let us verify your official Handicap Index."
      >
        <div className="flex items-center gap-2">
          <input
            {...register('ghin_number')}
            inputMode="numeric"
            className={inputClass}
            placeholder="e.g. 1234567"
          />
          <button
            type="button"
            onClick={verify}
            disabled={status === 'loading' || !isValidGhinNumber(String(ghinNumber))}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <ShieldCheck size={14} /> Verify with GHIN
              </>
            )}
          </button>
        </div>
        {message && (
          <p
            className={
              status === 'error'
                ? 'flex items-center gap-1 text-xs text-error'
                : status === 'verified'
                  ? 'flex items-center gap-1 text-xs text-primary'
                  : 'text-xs text-muted-foreground'
            }
          >
            {status === 'verified' && <CheckCircle size={13} />}
            {message}
          </p>
        )}
        {!message && (
          <p className="text-xs text-muted-foreground">
            {isVerified
              ? `Official Handicap Index — verified via GHIN${verifiedAt ? ` on ${new Date(verifiedAt).toLocaleDateString()}` : ''}.`
              : handicap != null
                ? 'Self-reported handicap.'
                : ''}
          </p>
        )}
      </Field>
    </>
  );
}
