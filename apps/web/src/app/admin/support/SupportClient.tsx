'use client';

// Support ticket workspace. Local-first; manual logging until an inbound
// channel is wired. Status changes are audit-logged.

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { useSupport, type TicketStatus, type TicketPriority } from '@/lib/admin/stores/support';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import { sportLabel } from '@/lib/admin/sports';
import { formatRelativeTime } from '@/lib/admin/format';

const STATUS: TicketStatus[] = ['open', 'pending', 'resolved', 'closed'];
const PRIORITY: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];
const PRIORITY_TONE: Record<TicketPriority, BadgeTone> = { low: 'neutral', normal: 'info', high: 'warning', urgent: 'danger' };
const STATUS_TONE: Record<TicketStatus, BadgeTone> = { open: 'warning', pending: 'info', resolved: 'success', closed: 'neutral' };

export function SupportClient({ actor }: { actor: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tickets = useSupport((s) => s.tickets);
  const addTicket = useSupport((s) => s.addTicket);
  const setStatus = useSupport((s) => s.setTicketStatus);
  const remove = useSupport((s) => s.removeTicket);

  const [form, setForm] = useState({ subject: '', requester: '', sport: 'golf', category: 'general', priority: 'normal' as TicketPriority, body: '' });

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading tickets…</p>;

  function add() {
    if (!form.subject.trim()) return;
    const t = addTicket(form);
    recordAudit({ actor, action: 'ticket.create', entityType: 'support-ticket', entityId: t.id, summary: `Logged ticket "${t.subject}"` });
    setForm({ ...form, subject: '', requester: '', body: '' });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground sm:col-span-2" />
        <input value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} placeholder="Requester (email)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        <select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
          {['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast'].map((s) => <option key={s} value={s}>{sportLabel(s)}</option>)}
        </select>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
          {PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Details…" rows={2} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground sm:col-span-2" />
        <button onClick={add} disabled={!form.subject.trim()} className="rounded-lg bg-warning px-3 py-2 text-sm font-medium text-foreground hover:bg-warning disabled:opacity-40 sm:col-span-2">Log ticket</button>
      </div>

      {tickets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No tickets yet. Log one above, or wire an inbound channel (email/contact form) to feed this queue.
        </p>
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li key={t.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{t.subject}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.requester || 'unknown'} · {sportLabel(t.sport)} · {t.category} · {formatRelativeTime(t.createdAt)}</p>
                  {t.body && <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={PRIORITY_TONE[t.priority]}>{t.priority}</StatusBadge>
                  <StatusBadge tone={STATUS_TONE[t.status]}>{t.status}</StatusBadge>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <select
                  value={t.status}
                  onChange={(e) => { setStatus(t.id, e.target.value as TicketStatus); recordAudit({ actor, action: 'ticket.status', entityType: 'support-ticket', entityId: t.id, summary: `Ticket "${t.subject}" → ${e.target.value}` }); }}
                  className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => remove(t.id)} className="ml-auto text-muted-foreground hover:text-error-text" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
