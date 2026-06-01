'use client';

import { useEffect, useRef, useState } from 'react';
import { Mail, CheckCircle2, Info } from 'lucide-react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import type { LeadSource } from '@/lib/email/capture';

type Status = 'idle' | 'submitting' | 'done' | 'error';

/**
 * Provider-agnostic email capture form. Posts to /api/email-capture
 * which stores the lead only if a provider is configured. The UI is
 * honest: it shows a confirmed message when the address is persisted
 * and a transparent note when email saving is not yet connected.
 */
export function EmailCapture({
  source,
  heading = 'Get your plan and progress reminders',
  subheading = 'We’ll email your plan and a retest reminder. No spam, unsubscribe anytime.',
  meta,
  className = '',
}: {
  source: LeadSource;
  heading?: string;
  subheading?: string;
  meta?: Record<string, string>;
  className?: string;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [persisted, setPersisted] = useState(false);
  const viewed = useRef(false);

  useEffect(() => {
    if (!viewed.current) {
      viewed.current = true;
      track(ANALYTICS_EVENTS.EMAIL_CAPTURE_VIEWED, { source });
    }
  }, [source]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, meta }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setPersisted(Boolean(data.persisted));
      setMessage(data.message || 'Thanks!');
      setStatus('done');
      track(ANALYTICS_EVENTS.EMAIL_CAPTURE_SUBMITTED, { source, persisted: Boolean(data.persisted) });
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (status === 'done') {
    return (
      <div className={`rounded-2xl border p-4 ${persisted ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'} ${className}`} role="status">
        <div className="flex items-start gap-2">
          {persisted ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" aria-hidden="true" />
          ) : (
            <Info size={18} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
          )}
          <p className={`text-sm ${persisted ? 'text-green-900' : 'text-blue-900'}`}>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`rounded-2xl border border-gray-200 bg-gray-50 p-4 ${className}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Mail size={16} className="text-green-700" aria-hidden="true" /> {heading}
      </p>
      <p className="mt-1 text-xs text-gray-600">{subheading}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`email-${source}`} className="sr-only">Email address</label>
        <input
          id={`email-${source}`}
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-green-500"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1"
        >
          {status === 'submitting' ? 'Sending…' : 'Email it to me'}
        </button>
      </div>
      {status === 'error' && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{message}</p>}
      <p className="mt-2 text-[11px] text-gray-400">
        We only use your email to send what you asked for. See our{' '}
        <a href="/privacy" className="underline">privacy policy</a>.
      </p>
    </form>
  );
}
