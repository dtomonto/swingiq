'use client';

// ============================================================
// Recruiting — RecruiterContactForm (used on the public coach view)
// ------------------------------------------------------------
// Lets a coach reach out without an account. Submissions are recorded
// against the share link and surfaced to the athlete; nothing here
// exposes the athlete's private contact details.
// ============================================================

import { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

export interface RecruiterContactFormProps {
  onSubmit: (data: { fromName: string; fromOrganization?: string; fromEmail: string; message: string }) => void;
}

export function RecruiterContactForm({ onSubmit }: RecruiterContactFormProps) {
  const [fromName, setFromName] = useState('');
  const [fromOrganization, setOrg] = useState('');
  const [fromEmail, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function submit() {
    if (!fromName.trim() || !fromEmail.trim() || !message.trim()) return;
    onSubmit({ fromName: fromName.trim(), fromOrganization: fromOrganization.trim() || undefined, fromEmail: fromEmail.trim(), message: message.trim() });
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-center">
        <Check size={20} className="text-success mx-auto mb-1" />
        <p className="text-sm font-medium text-foreground">Message sent</p>
        <p className="text-xs text-muted-foreground">The athlete (or their guardian) will follow up with you.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputCls} value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Your name *" />
        <input className={inputCls} value={fromOrganization} onChange={(e) => setOrg(e.target.value)} placeholder="School / organization" />
      </div>
      <input type="email" className={inputCls} value={fromEmail} onChange={(e) => setEmail(e.target.value)} placeholder="Your email *" />
      <textarea rows={3} className={inputCls} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message *" />
      <Button onClick={submit} disabled={!fromName.trim() || !fromEmail.trim() || !message.trim()}><Send size={14} /> Send message</Button>
      <p className="text-xs text-muted-foreground">By sending, you agree this message reaches the athlete or their guardian. Please follow your association&apos;s recruiting contact rules.</p>
    </div>
  );
}
