'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, CheckCircle2, Info } from 'lucide-react';
import { type ContactTopic } from '@/lib/email/contact';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" required>
          <Input
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      </div>

      {/* Select is a compound control (Root → Trigger), so its label points at the
          focusable trigger directly rather than via <Field>'s clone-id wiring. */}
      <div className="space-y-1.5">
        <label htmlFor="contact-topic" className="block text-sm font-medium text-foreground">
          What&apos;s this about?
        </label>
        <Select value={topic} onValueChange={(v) => setTopic(v as ContactTopic)}>
          <SelectTrigger id="contact-topic">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TOPIC_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Field label="Message" required>
        <Textarea
          minLength={10}
          rows={6}
          placeholder="Tell us what you think, what's working, or what we can improve…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="resize-y"
        />
      </Field>

      {status === 'error' && (
        <p role="alert" className="text-sm font-medium text-error-text">
          {feedback}
        </p>
      )}

      <Button type="submit" loading={status === 'submitting'}>
        {status === 'submitting' ? (
          'Sending…'
        ) : (
          <>
            <Send size={16} aria-hidden="true" />
            Send message
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        We only use your email to reply to you. See our{' '}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
