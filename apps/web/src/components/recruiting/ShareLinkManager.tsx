'use client';

// ============================================================
// Recruiting — ShareLinkManager
// ------------------------------------------------------------
// Create multiple share links with different permission levels, copy
// them, and revoke any of them instantly. Each link publishes a
// permission-filtered snapshot; revoking unpublishes it so the URL
// stops resolving. Contact is masked by default (safest for minors).
// ============================================================

import { useState } from 'react';
import { Link2, Copy, Check, Ban, Trash2, Plus, ShieldCheck } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useRecruitingStore,
  shareUrl,
  isLinkActive,
  SHARE_LINK_KIND_LABEL,
  type ShareLinkKind,
} from '@/lib/recruiting';

const KINDS: ShareLinkKind[] = ['coach', 'scout', 'team', 'public', 'password', 'expiring', 'analytics_anon'];

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

export function ShareLinkManager() {
  const links = useRecruitingStore((s) => s.shareLinks);
  const profile = useRecruitingStore((s) => s.profile);
  const createLink = useRecruitingStore((s) => s.createShareLink);
  const revokeLink = useRecruitingStore((s) => s.revokeShareLink);
  const deleteLink = useRecruitingStore((s) => s.deleteShareLink);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ShareLinkKind>('coach');
  const [label, setLabel] = useState('');
  const [recipient, setRecipient] = useState('');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [watermark, setWatermark] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function create() {
    if (!profile) return;
    createLink(kind, label.trim() || SHARE_LINK_KIND_LABEL[kind], {
      recipientName: recipient.trim() || undefined,
      password: kind === 'password' ? password.trim() || undefined : undefined,
      expiresAt: kind === 'expiring' && expiresAt ? new Date(expiresAt).toISOString() : null,
      watermark,
    });
    setLabel(''); setRecipient(''); setPassword(''); setExpiresAt(''); setOpen(false);
  }

  function copy(slug: string, id: string) {
    navigator.clipboard?.writeText(shareUrl(slug)).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Link2 size={17} className="text-primary" /> Share links</CardTitle>
        <Button size="sm" onClick={() => setOpen((o) => !o)} disabled={!profile}><Plus size={15} /> New link</Button>
      </CardHeader>
      <CardBody className="space-y-3">
        {!profile && <p className="text-sm text-muted-foreground">Create your profile first, then generate share links.</p>}

        {open && (
          <div className="rounded-lg border border-border p-3 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-sm font-medium text-foreground">Link type</span>
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as ShareLinkKind)}>
                {KINDS.map((k) => <option key={k} value={k}>{SHARE_LINK_KIND_LABEL[k]}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-sm font-medium text-foreground">Label</span>
              <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="State U — Coach Smith" />
            </label>
            {(kind === 'coach' || kind === 'scout' || kind === 'team') && (
              <label className="block"><span className="text-sm font-medium text-foreground">Recipient name</span>
                <input className={inputCls} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Coach Smith" />
              </label>
            )}
            {kind === 'password' && (
              <label className="block"><span className="text-sm font-medium text-foreground">Password</span>
                <input className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a passphrase" />
              </label>
            )}
            {kind === 'expiring' && (
              <label className="block"><span className="text-sm font-medium text-foreground">Expires</span>
                <input type="date" className={inputCls} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
              <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} /> Watermark this profile view
            </label>
            <div className="sm:col-span-2 flex gap-2">
              <Button onClick={create}>Create link</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {links.length === 0 ? (
          <EmptyState icon={Link2} compact title="No links yet" description="Create a coach-specific link to share film + data without an account on their end." />
        ) : (
          <div className="space-y-2">
            {links.map((l) => {
              const active = isLinkActive(l);
              return (
                <div key={l.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{l.label}</p>
                      <p className="text-xs text-muted-foreground break-all">{shareUrl(l.slug)}</p>
                    </div>
                    <Badge variant={active ? 'success' : 'default'}>{active ? 'Active' : l.revokedAt ? 'Revoked' : 'Expired'}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="info">{SHARE_LINK_KIND_LABEL[l.kind]}</Badge>
                    {l.permissions.showContactInfo && <Badge variant="warning">Shows contact</Badge>}
                    {!l.permissions.showVideo && <Badge variant="default">No video</Badge>}
                    {!l.permissions.showData && <Badge variant="default">No data</Badge>}
                    {l.watermark && <Badge variant="default"><ShieldCheck size={11} className="mr-1" />Watermarked</Badge>}
                    {l.expiresAt && <Badge variant="default">Expires {new Date(l.expiresAt).toLocaleDateString()}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => copy(l.slug, l.id)} disabled={!active}>
                      {copiedId === l.id ? <Check size={14} /> : <Copy size={14} />} {copiedId === l.id ? 'Copied' : 'Copy link'}
                    </Button>
                    {active && <Button size="sm" variant="ghost" onClick={() => revokeLink(l.id)}><Ban size={14} /> Revoke</Button>}
                    <button onClick={() => deleteLink(l.id)} className="ml-auto text-error/80 hover:text-error p-1.5 rounded-md hover:bg-error/10" aria-label="Delete link"><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t border-border pt-2">
          Coaches open links with no account. Engagement on shared links is collected so you can improve your profile — this is disclosed on the coach view.
        </p>
      </CardBody>
    </Card>
  );
}
