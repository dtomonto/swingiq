'use client';

// ============================================================
// Recruiting — PrivacyControls
// ------------------------------------------------------------
// Profile-wide privacy: visibility default, contact masking, a
// compliance reminder, report-abuse, and full data deletion. Privacy
// + safety controls are always available (never paywalled).
// ============================================================

import { useState } from 'react';
import { Lock, Trash2, Flag, FileWarning } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRecruitingStore, type Visibility } from '@/lib/recruiting';

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

export function PrivacyControls() {
  const profile = useRecruitingStore((s) => s.profile);
  const saveProfile = useRecruitingStore((s) => s.saveProfile);
  const reportAbuse = useRecruitingStore((s) => s.reportAbuse);
  const reset = useRecruitingStore((s) => s.reset);
  const links = useRecruitingStore((s) => s.shareLinks);
  const revokeLink = useRecruitingStore((s) => s.revokeShareLink);

  const [abuseReason, setAbuseReason] = useState('');
  const [abuseSent, setAbuseSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function deleteAll() {
    // Revoke every active link first so no published snapshot is left behind.
    links.filter((l) => l.active).forEach((l) => revokeLink(l.id));
    reset();
    setConfirmDelete(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock size={17} className="text-primary" /> Privacy defaults</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <label className="block max-w-xs"><span className="text-sm font-medium text-foreground">Default profile visibility</span>
            <select className={inputCls} value={profile?.visibility ?? 'private'} onChange={(e) => saveProfile({ visibility: e.target.value as Visibility })}>
              <option value="private">Private (only me)</option>
              <option value="link_only">Only people with a link</option>
              <option value="public">Public</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={profile?.maskAthleteContact ?? true} onChange={(e) => saveProfile({ maskAthleteContact: e.target.checked })} />
            Mask my direct contact and route coaches through my guardian/coach
          </label>
          <p className="text-xs text-muted-foreground">
            Your profile is private by default. Coaches only ever see what a specific share link allows — and you can revoke any link instantly.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileWarning size={16} className="text-warning" /> Recruiting compliance reminder</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm text-muted-foreground">
            Recruiting rules vary by level and change often. Follow the rules of your school, league, and association
            (NCAA, NAIA, NJCAA, club, and international/professional bodies where relevant). This app gives reminders, not legal advice —
            verify current rules with your coach or compliance office before contacting programs.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Flag size={16} className="text-muted-foreground" /> Report a problem</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          <textarea rows={2} className={inputCls} value={abuseReason} onChange={(e) => setAbuseReason(e.target.value)} placeholder="Report inappropriate content, impersonation, or a privacy concern." />
          <Button size="sm" variant="outline" disabled={!abuseReason.trim()} onClick={() => { reportAbuse({ reason: abuseReason.trim(), targetType: 'profile' }); setAbuseReason(''); setAbuseSent(true); }}>
            Submit report
          </Button>
          {abuseSent && <p className="text-xs text-success">Thanks — your report was logged.</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-error"><Trash2 size={16} /> Delete recruiting data</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          <p className="text-sm text-muted-foreground">Permanently remove your recruiting profile, film metadata, data, links, and analytics from this device. This cannot be undone.</p>
          {!confirmDelete ? (
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>Delete everything</Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="danger" onClick={deleteAll}>Yes, delete permanently</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
