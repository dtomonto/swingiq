'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Send, CheckCircle2, Info } from 'lucide-react';
import { CONTACT_TOPICS, type ContactTopic } from '@/lib/email/contact';

type Status = 'idle' | 'submitting' | 'done' | 'error';

const TOPIC_OPTIONS: { value: ContactTopic; label: string }[] = [
  { value: 'feedback', label: 'General feedback' },
  { value: 'bug', label: 'Something looks broken' },
  { value: 'idea', label: 'Feature idea / suggestion' },
  { value: 'question', label: 'A question' },
  { value: 'other', label: 'Other' },
];

/**
 * Contact form. Posts to /api/contact, which emails the message to the team
 * when email delivery is configured. The UI stays honest: it confirms delivery
 * only when the server actually sent the message, and otherwise tells the
 * visitor it was not sent (with a direct mailto fallback).
 */
export function ContactForm({ supportEmail }: { supportEmail: string }) {
  const pathname = usePathname();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<ContactTopic>('feedback');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState('');
  const [delivered, setDelivered] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setFeedback('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message, pagePath: pathname }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setFeedback(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setDelivered(Boolean(data.delivered));
      setFeedback(data.message || 'Thanks!');
      setStatus('done');
    } catch {
      setStatus('error');
      setFeedback('Network error. Please try again.');
    }
  }

  if (status === 'done') {
    return (
      <div
        className={`rounded-2xl border p-6 ${
          delivered ? 'border-primary/30 bg-primary/10' : 'border-accent-secondary/25 bg-accent-secondary/10'
        }`}
        role="status"
      >
        <div className="flex items-start gap-3">
          {delivered ? (
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <Info size={22} className="mt-0.5 shrink-0 text-accent-secondary" aria-hidden="true" />
          )}
          <div>
            <p className={`text-sm font-medium ${delivered ? 'text-primary' : 'text-foreground'}`}>{feedback}</p>
            {!delivered && (
              <p className="mt-2 text-sm text-muted-foreground">
                You can reach us directly at{' '}
                <a href={`mailto:${supportEmail}`} className="font-medium text-primary underline">
                  {supportEmail}
                </a>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const inputClasses =
    'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-foreground">
            Your name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-topic" className="mb-1 block text-sm font-medium text-foreground">
          What&apos;s this about?
        </label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value as ContactTopic)}
          className={inputClasses}
        >
          {TOPIC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          minLength={10}
          rows={6}
          placeholder="Tell us what you think, what's working, or what we can improve…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClasses} resize-y`}
        />
      </div>

      {status === 'error' && (
        <p role="alert" className="text-sm font-medium text-error">
          {feedback}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <Send size={16} aria-hidden="true" />
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>

      <p className="text-xs text-muted-foreground">
        We only use your email to reply to you. See our{' '}
        <a href="/privacy" className="underline">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}
