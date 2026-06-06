'use client';

// ============================================================
// Recruiting — OutreachAssistant
// ------------------------------------------------------------
// Drafts respectful coach/scout messages from the real profile. Hard
// guardrails: nothing auto-sends (drafts → approved → sent), and for a
// minor, approval is blocked until guardian consent allows outreach.
// The athlete reviews/edits every word before anything leaves.
// ============================================================

import { useMemo, useState } from 'react';
import { Mail, Copy, Check, Send, Trash2, ShieldAlert } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useRecruitingStore,
  buildOutreach,
  shareUrl,
  isMinor,
  isLinkActive,
  OUTREACH_KIND_LABEL,
  type OutreachKind,
} from '@/lib/recruiting';

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';
const KINDS = Object.keys(OUTREACH_KIND_LABEL) as OutreachKind[];

export function OutreachAssistant() {
  const state = useRecruitingStore();
  const messages = useRecruitingStore((s) => s.messages);
  const saveMessage = useRecruitingStore((s) => s.saveMessage);
  const approveMessage = useRecruitingStore((s) => s.approveMessage);
  const markSent = useRecruitingStore((s) => s.markMessageSent);
  const removeMessage = useRecruitingStore((s) => s.removeMessage);

  const minor = isMinor(state.profile?.dateOfBirth);
  const consentOk = !minor || state.guardianConsent.allowOutreach;
  const activeLink = state.shareLinks.find((l) => isLinkActive(l));
  const profileLink = activeLink ? shareUrl(activeLink.slug) : undefined;

  const [kind, setKind] = useState<OutreachKind>('initial');
  const [coachName, setCoachName] = useState('');
  const [org, setOrg] = useState('');
  const [update, setUpdate] = useState('');
  const [connection, setConnection] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const preview = useMemo(
    () => buildOutreach(state, { kind, contact: { name: coachName, organization: org, connection }, update, profileLink }),
    [state, kind, coachName, org, connection, update, profileLink],
  );

  function generate() {
    saveMessage({ kind, subject: preview.subject, body: preview.body, generator: 'deterministic', contactId: undefined });
  }

  function copy(id: string, text: string) {
    navigator.clipboard?.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); });
  }

  return (
    <div className="space-y-4">
      {minor && !consentOk && (
        <Card>
          <CardBody className="flex items-start gap-2 text-sm">
            <ShieldAlert size={16} className="text-warning mt-0.5 shrink-0" />
            <span className="text-foreground/85">This is a minor athlete. You can draft messages, but a guardian must enable outreach in <b>Privacy</b> before any message can be approved or sent.</span>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail size={17} className="text-primary" /> Compose</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-sm font-medium text-foreground">Message type</span>
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as OutreachKind)}>
                {KINDS.map((k) => <option key={k} value={k}>{OUTREACH_KIND_LABEL[k]}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-sm font-medium text-foreground">Coach name</span><input className={inputCls} value={coachName} onChange={(e) => setCoachName(e.target.value)} placeholder="Smith" /></label>
            <label className="block"><span className="text-sm font-medium text-foreground">School / organization</span><input className={inputCls} value={org} onChange={(e) => setOrg(e.target.value)} placeholder="State University" /></label>
            <label className="block"><span className="text-sm font-medium text-foreground">Recent update (optional)</span><input className={inputCls} value={update} onChange={(e) => setUpdate(e.target.value)} placeholder="Won the regional qualifier" /></label>
            <label className="block sm:col-span-2"><span className="text-sm font-medium text-foreground">Personal connection (optional)</span><input className={inputCls} value={connection} onChange={(e) => setConnection(e.target.value)} placeholder="We met at your camp last summer." /></label>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            {preview.subject && <p className="text-sm font-semibold text-foreground mb-1">Subject: {preview.subject}</p>}
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{preview.body}</p>
          </div>
          {!profileLink && <p className="text-xs text-warning">Tip: create a share link first so your profile URL is included automatically.</p>}
          <Button onClick={generate}>Save as draft</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Drafts & sent ({messages.length})</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet. Compose one above — nothing sends automatically.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground text-sm">{OUTREACH_KIND_LABEL[m.kind]}{m.subject ? ` — ${m.subject}` : ''}</p>
                  <Badge variant={m.status === 'sent' ? 'success' : m.status === 'approved' ? 'info' : 'default'}>{m.status}</Badge>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-4">{m.body}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy(m.id, `${m.subject ? m.subject + '\n\n' : ''}${m.body}`)}>{copiedId === m.id ? <Check size={14} /> : <Copy size={14} />} Copy</Button>
                  {m.status === 'draft' && <Button size="sm" onClick={() => approveMessage(m.id)} disabled={!consentOk}>Approve</Button>}
                  {m.status === 'approved' && <Button size="sm" onClick={() => markSent(m.id)}><Send size={14} /> Mark sent</Button>}
                  <button onClick={() => removeMessage(m.id)} className="ml-auto text-error/80 hover:text-error p-1.5 rounded-md hover:bg-error/10" aria-label="Delete message"><Trash2 size={15} /></button>
                </div>
              </div>
            ))
          )}
          <p className="text-xs text-muted-foreground border-t border-border pt-2">
            Messages never send themselves and never guarantee scholarships, offers, or roster spots. You copy/send each one yourself after review.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
