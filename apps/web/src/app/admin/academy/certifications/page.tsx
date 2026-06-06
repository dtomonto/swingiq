'use client';

import Link from 'next/link';
import { CERTIFICATIONS, getCourse, getChallenge, getQuiz } from '@/lib/academy/content';
import { useAcademyStore } from '@/lib/academy/store';
import {
  certificationReadiness, isCertificationEligible, isCertified, isCourseComplete, hasPassedQuiz,
} from '@/lib/academy/engine';
import { useMounted, ProgressBar } from '@/components/academy/parts';
import { Button } from '@/components/ui/Button';

function Req({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className={done ? 'text-success' : 'text-muted-foreground'}>{done ? '✓' : '○'}</span>
      <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{children}</span>
    </li>
  );
}

export default function CertificationsPage() {
  const mounted = useMounted();
  const progress = useAcademyStore((s) => s.progress);
  const claim = useAcademyStore((s) => s.claimCertification);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Certification Center</h1>
        <p className="text-muted-foreground">Earn and track your SwingVantage certifications.</p>
      </div>

      <div className="space-y-5">
        {CERTIFICATIONS.map((cert) => {
          const earned = mounted && isCertified(progress, cert.id);
          const eligible = mounted && isCertificationEligible(progress, cert);
          const ready = mounted ? certificationReadiness(progress, cert) : 0;
          const rec = progress.certifications[cert.id];
          return (
            <section key={cert.id} className="rounded-theme border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{cert.emoji}</span>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{cert.name}</h2>
                    <p className="max-w-xl text-sm text-muted-foreground">{cert.description}</p>
                  </div>
                </div>
                {earned ? (
                  <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">✓ Certified</span>
                ) : eligible ? (
                  <Button onClick={() => claim(cert.id)}>Claim certification</Button>
                ) : (
                  <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{ready}% ready</span>
                )}
              </div>

              {!earned && <div className="mt-4 max-w-md"><ProgressBar value={ready} /></div>}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Required courses</h3>
                  <ul className="space-y-1">
                    {cert.requiredCourseIds.map((cid) => {
                      const c = getCourse(cid);
                      return c ? <Req key={cid} done={mounted && isCourseComplete(progress, c)}><Link href={`/admin/academy/course/${c.slug}`} className="hover:underline">{c.title}</Link></Req> : null;
                    })}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Challenges & exam</h3>
                  <ul className="space-y-1">
                    {(cert.requiredChallengeIds ?? []).map((chId) => {
                      const ch = getChallenge(chId);
                      return ch ? <Req key={chId} done={mounted && !!progress.challengeSubmissions[chId]}>{ch.title}</Req> : null;
                    })}
                    {cert.finalAssessmentQuizId && (() => {
                      const q = getQuiz(cert.finalAssessmentQuizId);
                      return q ? <Req done={mounted && hasPassedQuiz(progress, cert.finalAssessmentQuizId!)}>Final assessment: {q.title} (≥{q.passingScore}%)</Req> : null;
                    })()}
                    {(cert.requiredChallengeIds ?? []).length === 0 && !cert.finalAssessmentQuizId && (
                      <li className="text-sm text-muted-foreground">No extra challenge or exam.</li>
                    )}
                  </ul>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {cert.expiresMonths ? `Valid ${cert.expiresMonths} months, then recertify.` : 'Does not expire.'}
                {earned && rec?.expiresAt ? ` · Expires ${new Date(rec.expiresAt).toLocaleDateString()}` : ''}
              </p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
