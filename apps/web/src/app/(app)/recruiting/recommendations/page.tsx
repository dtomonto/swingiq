'use client';

// ============================================================
// /recruiting/recommendations — School & contact matcher
// ------------------------------------------------------------
// Turns the athlete's golf data + academics into division fit + ranked program
// recommendations, and drafts an outreach message for any one of them (reusing
// the existing buildOutreach engine). Honest-first: shows a data-confidence
// level + disclaimers, and never fabricates coach contacts.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, MapPin, Mail, Copy, Check, Info, Trophy } from 'lucide-react';
import { useRecruitingStore } from '@/lib/recruiting/store';
import { computeProfileStrength } from '@/lib/recruiting/strength';
import { buildOutreach } from '@/lib/recruiting/outreach';
import {
  recommendSchools,
  type FitLevel,
  type SchoolRecommendation,
} from '@/lib/recruiting/school-match';

const FIT_STYLE: Record<FitLevel, string> = {
  match: 'bg-emerald-600/15 text-emerald-300 border-emerald-600/40',
  safety: 'bg-sky-600/15 text-sky-300 border-sky-600/40',
  reach: 'bg-amber-600/15 text-amber-300 border-amber-600/40',
  stretch: 'bg-gray-600/20 text-gray-400 border-gray-600/40',
};
const CONFIDENCE_STYLE: Record<'low' | 'medium' | 'high', string> = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-gray-400',
};

function numOrNull(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function RecommendationsPage() {
  const profile = useRecruitingStore((s) => s.profile);
  const metrics = useRecruitingStore((s) => s.metrics);

  // Prefill from the profile + recorded metrics; everything stays editable.
  const seededHandicap = useMemo(() => {
    const m = metrics.find((x) => x.metricKey === 'handicap');
    return m && m.currentValue != null && Number.isFinite(m.currentValue) ? String(m.currentValue) : '';
  }, [metrics]);

  const [handicap, setHandicap] = useState(seededHandicap);
  const [gpa, setGpa] = useState(profile?.gpa != null ? String(profile.gpa) : '');
  const [gradYear, setGradYear] = useState(profile?.graduationYear != null ? String(profile.graduationYear) : '');
  const [region, setRegion] = useState(profile?.hometownRegion ?? '');
  const [draftFor, setDraftFor] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sport = profile?.primarySport ?? 'golf';

  const result = useMemo(
    () =>
      recommendSchools({
        sport,
        handicap: numOrNull(handicap),
        gpa: numOrNull(gpa),
        graduationYear: numOrNull(gradYear),
        region: region || undefined,
        strengthTier: computeProfileStrength(useRecruitingStore.getState()).tier,
      }),
    [sport, handicap, gpa, gradYear, region],
  );

  function draft(rec: SchoolRecommendation): { subject: string; body: string } {
    const state = useRecruitingStore.getState();
    return buildOutreach(state, {
      kind: 'initial',
      contact: { name: '', organization: rec.school.name },
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Trophy className="h-6 w-6 text-primary" /> Find your fit
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          From your golf data and academics, here are the college levels and programs that fit — and a ready-to-send
          message for any of them.
        </p>
      </header>

      {/* Inputs */}
      <section className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
        <Field label="Handicap" value={handicap} onChange={setHandicap} placeholder="e.g. 4.2" type="number" />
        <Field label="GPA" value={gpa} onChange={setGpa} placeholder="e.g. 3.7" type="number" />
        <Field label="Grad year" value={gradYear} onChange={setGradYear} placeholder="e.g. 2027" type="number" />
        <Field label="Region" value={region} onChange={setRegion} placeholder="e.g. West" type="text" />
      </section>

      {!result.supported ? (
        <p className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-4 text-sm text-amber-300">
          {result.message}
        </p>
      ) : (
        <>
          {/* Level summary */}
          <section className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">{result.athleticLevelLabel}</p>
            <p className="mt-1 text-xs">
              Read confidence:{' '}
              <span className={`font-semibold ${CONFIDENCE_STYLE[result.dataConfidence]}`}>
                {result.dataConfidence}
              </span>
              {result.dataConfidence !== 'high' && ' — add your handicap, GPA, and grad year for a sharper read.'}
            </p>
            {/* Division fit */}
            {result.divisionFits.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.divisionFits.map((d) => (
                  <span
                    key={d.division}
                    title={d.rationale}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${FIT_STYLE[d.fit]}`}
                  >
                    {d.division}: {d.fit}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Recommendations */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">Recommended programs</h2>
            {result.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add your handicap above to see matched programs.</p>
            ) : (
              <ul className="space-y-2">
                {result.recommendations.map((rec) => (
                  <li key={rec.school.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{rec.school.name}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{rec.school.division}</span>
                          <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{rec.school.region}</span>
                        </p>
                        <ul className="mt-1.5 space-y-0.5">
                          {rec.reasons.map((why, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {why}</li>
                          ))}
                        </ul>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${FIT_STYLE[rec.fit]}`}>
                        {rec.fit}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setDraftFor(draftFor === rec.school.id ? null : rec.school.id); setCopied(false); }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Mail className="h-3.5 w-3.5" /> {draftFor === rec.school.id ? 'Hide draft' : 'Draft outreach'}
                    </button>
                    {draftFor === rec.school.id && (
                      <OutreachDraft draft={draft(rec)} copied={copied} onCopy={() => setCopied(true)} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Honest disclaimers */}
          <section className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Info className="h-3.5 w-3.5" /> Before you reach out
            </p>
            <ul className="mt-1.5 space-y-1">
              {result.disclaimers.map((d, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {d}</li>
              ))}
              <li className="text-xs text-muted-foreground">
                • Look up each program’s current head coach on its official athletics site, then paste their address into your email.
              </li>
            </ul>
            <Link href="/recruiting/outreach" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <GraduationCap className="h-3.5 w-3.5" /> Manage all your outreach
            </Link>
          </section>
        </>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function OutreachDraft({ draft, copied, onCopy }: { draft: { subject: string; body: string }; copied: boolean; onCopy: () => void }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-3">
      <p className="text-xs font-semibold text-foreground">Subject</p>
      <p className="text-xs text-muted-foreground">{draft.subject}</p>
      <p className="mt-2 text-xs font-semibold text-foreground">Message</p>
      <pre className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{draft.body}</pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(`Subject: ${draft.subject}\n\n${draft.body}`).then(onCopy, () => {});
        }}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy message</>}
      </button>
    </div>
  );
}
