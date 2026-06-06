'use client';

// ============================================================
// Public coach-facing recruiting profile — /player/[shareSlug]
// ------------------------------------------------------------
// Renders a permission-filtered snapshot published by the athlete. No
// app chrome, noindex (see layout). Honest states for revoked/expired
// links and for cross-device links that need cloud sync to resolve.
// Password-protected links prompt with a soft gate before rendering.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Lock, LinkIcon, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  useRecruitingStore,
  readPublishedSnapshot,
  hashPassword,
  isLinkActive,
  openSnapshotPacketForPrint,
  type CoachViewSnapshot,
} from '@/lib/recruiting';
import { CoachProfileView } from '@/components/recruiting';

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-2xl border border-border bg-card p-6 text-center space-y-3">{children}</div>
    </div>
  );
}

export default function PlayerPublicPage() {
  const params = useParams();
  const slug = Array.isArray(params.shareSlug) ? params.shareSlug[0] : (params.shareSlug as string);

  const links = useRecruitingStore((s) => s.shareLinks);
  const recordEngagement = useRecruitingStore((s) => s.recordEngagement);
  const addContactSubmission = useRecruitingStore((s) => s.addContactSubmission);

  const [snapshot, setSnapshot] = useState<CoachViewSnapshot | null | undefined>(undefined);
  const [pwInput, setPwInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [pwError, setPwError] = useState(false);

  const link = useMemo(() => links.find((l) => l.slug === slug), [links, slug]);
  const linkActive = link ? isLinkActive(link) : true; // unknown link (cross-device) → rely on snapshot presence

  useEffect(() => {
    // One-time mount read of the client-only published snapshot (localStorage).
    const snap = readPublishedSnapshot(slug);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(snap);
    if (snap && linkActive) {
      recordEngagement({ type: 'profile_view', shareLinkId: link?.id, viewerKey: 'viewer-' + slug.slice(0, 4) });
    }
    if (link && !linkActive) {
      recordEngagement({ type: 'revoked_attempt', shareLinkId: link.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Loading
  if (snapshot === undefined) {
    return <Shell><p className="text-muted-foreground text-sm">Loading profile…</p></Shell>;
  }

  // Link revoked/expired (known link, inactive)
  if (link && !linkActive) {
    return (
      <Shell>
        <ShieldAlert size={28} className="mx-auto text-warning" />
        <h1 className="text-lg font-bold text-foreground">This link is no longer active</h1>
        <p className="text-sm text-muted-foreground">The athlete revoked or expired this share link. Ask them for a current one.</p>
      </Shell>
    );
  }

  // No snapshot found on this device
  if (!snapshot) {
    return (
      <Shell>
        <LinkIcon size={28} className="mx-auto text-muted-foreground" />
        <h1 className="text-lg font-bold text-foreground">Profile not available here</h1>
        <p className="text-sm text-muted-foreground">
          This recruiting link opens on the device where it was created. Cross-device sharing turns on once the athlete connects a cloud account.
        </p>
      </Shell>
    );
  }

  // Password gate
  if (snapshot.passwordProtected && !unlocked) {
    return (
      <Shell>
        <Lock size={28} className="mx-auto text-primary" />
        <h1 className="text-lg font-bold text-foreground">Password required</h1>
        <p className="text-sm text-muted-foreground">This profile is protected. Enter the passphrase the athlete shared.</p>
        <input className={inputCls} type="password" value={pwInput} onChange={(e) => { setPwInput(e.target.value); setPwError(false); }} placeholder="Passphrase" />
        {pwError && <p className="text-xs text-error">That passphrase didn&apos;t match.</p>}
        <Button className="w-full" onClick={() => {
          if (snapshot.passwordHash && hashPassword(pwInput) === snapshot.passwordHash) setUnlocked(true);
          else setPwError(true);
        }}>Unlock</Button>
      </Shell>
    );
  }

  return (
    <CoachProfileView
      snapshot={snapshot}
      onEvent={(type, targetId) => recordEngagement({ type, shareLinkId: link?.id, targetId })}
      onDownloadPacket={() => openSnapshotPacketForPrint(snapshot)}
      onContact={(data) => {
        addContactSubmission({ ...data, shareLinkId: link?.id });
        recordEngagement({ type: 'contact_submit', shareLinkId: link?.id });
      }}
    />
  );
}
