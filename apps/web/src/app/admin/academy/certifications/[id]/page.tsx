'use client';

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { getCertification, getBadge } from '@/lib/academy/content';
import { useAcademyStore } from '@/lib/academy/store';
import { isCertified, certificationReadiness } from '@/lib/academy/engine';
import { useMounted, ProgressBar } from '@/components/academy/parts';
import { Button } from '@/components/ui/Button';

export default function CertificatePage() {
  const mounted = useMounted();
  const { id } = useParams<{ id: string }>();
  const progress = useAcademyStore((s) => s.progress);
  const setLearnerName = useAcademyStore((s) => s.setLearnerName);

  const cert = getCertification(id);
  if (!cert) return notFound();

  const earned = mounted && isCertified(progress, cert.id);
  const rec = progress.certifications[cert.id];
  const badge = getBadge(cert.badgeId);

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (!earned) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <Link href="/admin/academy/certifications" className="text-sm text-primary hover:underline">← Certification Center</Link>
        <div className="rounded-theme border border-border bg-card p-8">
          <p className="text-5xl">{cert.emoji}</p>
          <h1 className="mt-3 text-xl font-bold text-foreground">{cert.name}</h1>
          <p className="mt-2 text-muted-foreground">Not earned yet — you’re {certificationReadiness(progress, cert)}% of the way there.</p>
          <div className="mx-auto mt-4 max-w-xs"><ProgressBar value={certificationReadiness(progress, cert)} /></div>
          <Link href="/admin/academy/certifications" className="mt-4 inline-block"><Button>View requirements</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between no-print">
        <Link href="/admin/academy/certifications" className="text-sm text-primary hover:underline">← Certification Center</Link>
        <Button variant="outline" onClick={() => window.print()}>Print / Save PDF</Button>
      </div>

      {/* Certificate */}
      <div className="rounded-theme border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5 p-10 text-center shadow-theme">
        <div className="flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">SV</span>
          <span className="text-lg font-bold text-foreground">SwingVantage Academy</span>
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">Certificate of Achievement</p>
        <p className="mt-6 text-sm text-muted-foreground">This certifies that</p>

        {/* Holder name — editable inline (off-print uses input; print shows text) */}
        <div className="mx-auto mt-2 max-w-sm">
          <input
            value={progress.learnerName ?? ''}
            onChange={(e) => setLearnerName(e.target.value)}
            placeholder="Your name"
            className="w-full border-b border-border bg-transparent pb-1 text-center text-2xl font-bold text-foreground outline-none focus:border-primary"
          />
        </div>

        <p className="mt-6 text-sm text-muted-foreground">has earned the certification</p>
        <h1 className="mt-2 text-2xl font-bold text-primary">{cert.emoji} {cert.name}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">{cert.description}</p>

        <div className="mt-8 flex items-center justify-center gap-10 text-sm">
          <div>
            <p className="font-semibold text-foreground">{rec?.earnedAt ? new Date(rec.earnedAt).toLocaleDateString() : '—'}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Issued</p>
          </div>
          {badge && <span className="text-4xl" aria-hidden>{badge.emoji}</span>}
          <div>
            <p className="font-semibold text-foreground">{rec?.expiresAt ? new Date(rec.expiresAt).toLocaleDateString() : 'No expiry'}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Valid through</p>
          </div>
        </div>

        <p className="mt-8 text-2xs text-muted-foreground">Internal SwingVantage enablement credential · ID {cert.id}</p>
      </div>
    </div>
  );
}
