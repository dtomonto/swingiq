'use client';

// ============================================================
// Recruiting — CoachProfileView (public coach-facing render)
// ------------------------------------------------------------
// Premium, mobile-first evaluation view built from a permission-filtered
// CoachViewSnapshot. No app chrome, fast scan: hero → featured reel →
// snapshot → key metrics → summary → film → notes → contact. Every
// number shows its source; honest disclosures + (optional) watermark
// are always present. Password-gated links prompt before rendering.
// ============================================================

import { useState } from 'react';
import {
  ShieldCheck, Film, Download, Mail, Bookmark, GraduationCap, MapPin, Ruler,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  type CoachViewSnapshot,
  getMetricDef,
  benchmarkPosition,
  DATA_SOURCE_LABEL,
  PLAYER_TYPE_LABEL,
  RECRUITING_STATUS_LABEL,
  VERIFIED_SOURCES,
  type RecruitingStatus,
  type PlayerType,
} from '@/lib/recruiting';
import { SPORT_META } from '@/lib/recruiting/sports';
import { RecruiterContactForm } from './RecruiterContactForm';

export interface CoachProfileViewProps {
  snapshot: CoachViewSnapshot;
  onContact?: (data: { fromName: string; fromOrganization?: string; fromEmail: string; message: string }) => void;
  onDownloadPacket?: () => void;
  onEvent?: (type: 'video_view' | 'packet_download' | 'link_click', targetId?: string) => void;
}

export function CoachProfileView({ snapshot, onContact, onDownloadPacket, onEvent }: CoachProfileViewProps) {
  const a = snapshot.athlete;
  const sport = snapshot.sport;
  const meta = SPORT_META[sport];
  const [bookmarked, setBookmarked] = useState(false);

  const heightStr = a.heightInches ? `${Math.floor(a.heightInches / 12)}'${a.heightInches % 12}"` : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {snapshot.watermark && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
          <span className="rotate-[-30deg] text-[14vw] font-black text-foreground/[0.035] whitespace-nowrap select-none">{a.name} · SwingVantage</span>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-6 space-y-5">
        {/* Hero */}
        <header className="rounded-2xl border border-border bg-card p-5" style={{ borderTopColor: meta.accentColor, borderTopWidth: 3 }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{meta.emoji} {meta.name}</p>
              <h1 className="text-2xl font-bold text-foreground">{a.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {[a.graduationYear ? `Class of ${a.graduationYear}` : '', a.position, PLAYER_TYPE_LABEL[a.playerType as PlayerType]].filter(Boolean).join(' · ')}
              </p>
            </div>
            <Badge variant="info">{RECRUITING_STATUS_LABEL[a.recruitingStatus as RecruitingStatus]}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
            {a.schoolOrClub && <span className="flex items-center gap-1"><GraduationCap size={14} /> {a.schoolOrClub}</span>}
            {a.hometownRegion && <span className="flex items-center gap-1"><MapPin size={14} /> {a.hometownRegion}</span>}
            {(heightStr || a.weightLbs) && <span className="flex items-center gap-1"><Ruler size={14} /> {[heightStr, a.weightLbs ? `${a.weightLbs} lb` : ''].filter(Boolean).join(', ')}</span>}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {snapshot.permissions.canContact && <Button size="sm" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}><Mail size={14} /> Contact</Button>}
            {snapshot.permissions.canDownloadPacket && <Button size="sm" variant="outline" onClick={() => { onEvent?.('packet_download'); onDownloadPacket?.(); }}><Download size={14} /> Download packet</Button>}
            <Button size="sm" variant="ghost" onClick={() => setBookmarked((b) => !b)}><Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} /> {bookmarked ? 'Saved' : 'Save'}</Button>
          </div>
        </header>

        {/* Featured reel */}
        {snapshot.featuredReel && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Featured reel</h2>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
              <Film size={28} style={{ color: meta.accentColor }} />
              <div>
                <p className="font-medium text-foreground">{snapshot.featuredReel.title}</p>
                <p className="text-xs text-muted-foreground">{snapshot.featuredReel.clipIds.length} clips · request full film below</p>
              </div>
            </div>
          </section>
        )}

        {/* AI summary */}
        {snapshot.summary && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Player summary</h2>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{snapshot.summary.body}</p>
            {snapshot.summary.caveats.length > 0 && (
              <ul className="mt-3 list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                {snapshot.summary.caveats.map((c) => <li key={c}>{c}</li>)}
              </ul>
            )}
          </section>
        )}

        {/* Key metrics */}
        {snapshot.permissions.showData && snapshot.metrics.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Key metrics</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {snapshot.metrics.filter((m) => m.currentValue != null).map((m) => {
                const def = getMetricDef(m.metricKey);
                const pos = benchmarkPosition(m.metricKey, sport, m.currentValue!);
                const verified = VERIFIED_SOURCES.has(m.source as never) || m.coachValidated;
                return (
                  <div key={m.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">{def?.label ?? m.metricKey}</span>
                      <span className="text-lg font-bold text-foreground tabular-nums">{m.currentValue}{m.unit ? ` ${m.unit}` : ''}</span>
                    </div>
                    {pos && (
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-1.5">
                        <div className="h-full rounded-full" style={{ width: `${pos.normalized}%`, background: meta.accentColor }} />
                      </div>
                    )}
                    <div className="mt-1.5">
                      <Badge variant={verified ? 'success' : 'default'}>
                        {verified && <ShieldCheck size={11} className="mr-1" />}{DATA_SOURCE_LABEL[m.source]}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Film library */}
        {snapshot.permissions.showVideo && snapshot.film.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Film ({snapshot.film.length})</h2>
            <ul className="space-y-2">
              {snapshot.film.map((f) => (
                <li key={f.id}>
                  <button type="button" className="w-full text-left flex items-center gap-3 rounded-lg bg-muted/40 p-2.5 hover:bg-muted/70 transition-colors" onClick={() => onEvent?.('video_view', f.id)}>
                    <Film size={18} className="text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{f.category.replace(/_/g, ' ')}{f.opponentOrEvent ? ` · ${f.opponentOrEvent}` : ''}{f.resultOutcome ? ` · ${f.resultOutcome}` : ''}</p>
                    </div>
                    {VERIFIED_SOURCES.has(f.source as never) && <ShieldCheck size={14} className="text-success ml-auto shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Coach notes */}
        {snapshot.coachNotes.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Coach / trainer notes</h2>
            <div className="space-y-2">
              {snapshot.coachNotes.map((n) => (
                <blockquote key={n.id} className="border-s-4 border-primary ps-3 py-1">
                  <p className="text-sm text-foreground/90 italic">“{n.body}”</p>
                  <footer className="text-xs text-muted-foreground mt-1">— {n.authorName}{n.authorRole ? `, ${n.authorRole}` : ''}{n.verified ? ' (verified)' : ''}</footer>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        {snapshot.permissions.canContact && (
          <section id="contact" className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Contact this athlete</h2>
            {snapshot.contact && snapshot.contact.length > 0 && (
              <div className="mb-3 space-y-1 text-sm">
                {snapshot.contact.map((c) => <p key={c.label}><span className="text-muted-foreground">{c.label}:</span> <span className="text-foreground">{c.value}</span></p>)}
              </div>
            )}
            {onContact && <RecruiterContactForm onSubmit={onContact} />}
          </section>
        )}

        {/* Disclosures */}
        <footer className="rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
          {snapshot.disclosures.map((d) => <p key={d}>{d}</p>)}
          <p className="pt-1">Powered by SwingVantage · This profile describes evidence and does not project recruiting outcomes.</p>
        </footer>
      </div>
    </div>
  );
}
