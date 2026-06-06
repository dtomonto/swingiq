'use client';

// ============================================================
// Recruiting — FilmLibrary (uploader + tagger + list)
// ------------------------------------------------------------
// Add film with rich metadata, tag camera angle / category / source,
// feature clips, and set per-asset visibility. Raw video stays on the
// device until cloud storage is connected (honest local-first framing);
// we only read duration locally to help the quality score.
// ============================================================

import { useMemo, useState } from 'react';
import { Film, Star, Trash2, Plus, CircleAlert, Info, CheckCircle2 } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import {
  useRecruitingStore,
  analyzeFilmLibrary,
  scoreFilmQuality,
  type FilmCategory,
  type CameraAngle,
  type DataSource,
  type Visibility,
} from '@/lib/recruiting';
import { DataSourceLabel } from './DataSourceLabel';

const CATEGORIES: { v: FilmCategory; label: string }[] = [
  { v: 'highlight_reel', label: 'Highlight reel' }, { v: 'full_game', label: 'Full game' },
  { v: 'full_at_bat', label: 'Full at-bat' }, { v: 'bullpen_session', label: 'Bullpen' },
  { v: 'swing_session', label: 'Swing session' }, { v: 'practice_session', label: 'Practice' },
  { v: 'tournament_footage', label: 'Tournament' }, { v: 'match_play', label: 'Match play' },
  { v: 'range_session', label: 'Range' }, { v: 'driver_session', label: 'Driver' },
  { v: 'iron_session', label: 'Irons' }, { v: 'wedge_session', label: 'Wedges' },
  { v: 'putting_session', label: 'Putting' }, { v: 'serve_session', label: 'Serve' },
  { v: 'groundstroke_session', label: 'Groundstrokes' }, { v: 'fielding_session', label: 'Fielding' },
  { v: 'throwing_session', label: 'Throwing' }, { v: 'athletic_testing', label: 'Athletic testing' },
  { v: 'coach_evaluation', label: 'Coach evaluation' }, { v: 'before_after', label: 'Before/after' },
];

const ANGLES: { v: CameraAngle; label: string }[] = [
  { v: 'face_on', label: 'Face-on' }, { v: 'down_the_line', label: 'Down-the-line' },
  { v: 'behind', label: 'Behind' }, { v: 'side', label: 'Side' }, { v: 'overhead', label: 'Overhead' },
  { v: 'broadcast', label: 'Broadcast' }, { v: 'field_view', label: 'Field view' },
  { v: 'court_view', label: 'Court view' }, { v: 'pitcher_catcher', label: 'Pitcher/catcher' },
  { v: 'tee_view', label: 'Tee view' }, { v: 'launch_monitor', label: 'Launch monitor' },
];

const SOURCES: { v: DataSource; label: string }[] = [
  { v: 'self_reported', label: 'Uploaded by athlete' }, { v: 'event_verified', label: 'Event verified' },
  { v: 'coach_verified', label: 'Verified by coach' }, { v: 'device_imported', label: 'Imported from device' },
];

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

const FINDING_ICON = { good: CheckCircle2, warn: CircleAlert, info: Info } as const;
const FINDING_COLOR = { good: 'text-success', warn: 'text-warning', info: 'text-accent-secondary' } as const;

export function FilmLibrary({ sport }: { sport: SportId }) {
  const film = useRecruitingStore((s) => s.film);
  const addFilm = useRecruitingStore((s) => s.addFilm);
  const updateFilm = useRecruitingStore((s) => s.updateFilm);
  const removeFilm = useRecruitingStore((s) => s.removeFilm);
  const toggleFeatured = useRecruitingStore((s) => s.toggleFilmFeatured);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: '', category: 'swing_session' as FilmCategory, cameraAngle: '' as CameraAngle | '',
    date: '', opponentOrEvent: '', resultOutcome: '', source: 'self_reported' as DataSource,
    visibility: 'link_only' as Visibility, durationSeconds: null as number | null, tags: '',
  });

  const live = useMemo(() => film.filter((f) => !f.deletedAt), [film]);
  const findings = useMemo(() => analyzeFilmLibrary(film), [film]);

  function onFile(file: File | undefined) {
    if (!file) return;
    setDraft((d) => ({ ...d, title: d.title || file.name.replace(/\.[^.]+$/, '') }));
    // Best-effort local duration read; never uploads.
    try {
      const url = URL.createObjectURL(file);
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        setDraft((d) => ({ ...d, durationSeconds: Math.round(v.duration) || null }));
        URL.revokeObjectURL(url);
      };
      v.src = url;
    } catch { /* metadata read is best-effort */ }
  }

  function submit() {
    if (!draft.title.trim()) return;
    addFilm({
      title: draft.title.trim(),
      sport,
      category: draft.category,
      cameraAngle: draft.cameraAngle || undefined,
      date: draft.date || undefined,
      opponentOrEvent: draft.opponentOrEvent || undefined,
      resultOutcome: draft.resultOutcome || undefined,
      source: draft.source,
      visibility: draft.visibility,
      durationSeconds: draft.durationSeconds,
      tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setDraft((d) => ({ ...d, title: '', opponentOrEvent: '', resultOutcome: '', date: '', durationSeconds: null, tags: '' }));
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      {findings.length > 0 && (
        <Card>
          <CardBody className="space-y-1.5">
            {findings.map((f, i) => {
              const Icon = FINDING_ICON[f.level];
              return (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Icon size={15} className={cn('mt-0.5 shrink-0', FINDING_COLOR[f.level])} aria-hidden="true" />
                  <span className="text-foreground/80">{f.message}</span>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{live.length} video{live.length === 1 ? '' : 's'}</h3>
        <Button size="sm" onClick={() => setOpen((o) => !o)}><Plus size={15} /> Add film</Button>
      </div>

      {open && (
        <Card>
          <CardHeader><CardTitle>Add film</CardTitle></CardHeader>
          <CardBody className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 block">
              <span className="text-sm font-medium text-foreground">Video file (optional)</span>
              <span className="block text-xs text-muted-foreground mb-1">Stays on this device until cloud storage is connected. We only read the length to help score quality.</span>
              <input type="file" accept="video/*" className={inputCls} onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <label className="block sm:col-span-2"><span className="text-sm font-medium text-foreground">Title</span>
              <input className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="vs Rival HS — 2 doubles" /></label>
            <label className="block"><span className="text-sm font-medium text-foreground">Category</span>
              <select className={inputCls} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as FilmCategory })}>
                {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}</select></label>
            <label className="block"><span className="text-sm font-medium text-foreground">Camera angle</span>
              <select className={inputCls} value={draft.cameraAngle} onChange={(e) => setDraft({ ...draft, cameraAngle: e.target.value as CameraAngle })}>
                <option value="">—</option>{ANGLES.map((a) => <option key={a.v} value={a.v}>{a.label}</option>)}</select></label>
            <label className="block"><span className="text-sm font-medium text-foreground">Date</span>
              <input type="date" className={inputCls} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
            <label className="block"><span className="text-sm font-medium text-foreground">Opponent / event</span>
              <input className={inputCls} value={draft.opponentOrEvent} onChange={(e) => setDraft({ ...draft, opponentOrEvent: e.target.value })} placeholder="Rival HS / State Qualifier" /></label>
            <label className="block"><span className="text-sm font-medium text-foreground">Result / outcome</span>
              <input className={inputCls} value={draft.resultOutcome} onChange={(e) => setDraft({ ...draft, resultOutcome: e.target.value })} placeholder="2-4, 2B" /></label>
            <label className="block"><span className="text-sm font-medium text-foreground">Source</span>
              <select className={inputCls} value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as DataSource })}>
                {SOURCES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}</select></label>
            <label className="block"><span className="text-sm font-medium text-foreground">Visibility</span>
              <select className={inputCls} value={draft.visibility} onChange={(e) => setDraft({ ...draft, visibility: e.target.value as Visibility })}>
                <option value="private">Private (only me)</option><option value="link_only">Shared on links</option><option value="public">Public</option></select></label>
            <label className="block sm:col-span-2"><span className="text-sm font-medium text-foreground">Tags (comma-separated)</span>
              <input className={inputCls} value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="leadoff, opposite-field" /></label>
            <div className="sm:col-span-2 flex gap-2">
              <Button onClick={submit} disabled={!draft.title.trim()}>Add to library</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {live.length === 0 ? (
        <Card><CardBody><EmptyState icon={Film} title="No film yet" description="Your first upload is the single biggest profile boost. Game or match footage counts most." /></CardBody></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {live.map((f) => {
            const q = f.qualityScore ?? scoreFilmQuality(f);
            return (
              <Card key={f.id}>
                <CardBody className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{f.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {f.category.replace(/_/g, ' ')}{f.cameraAngle ? ` · ${f.cameraAngle.replace(/_/g, ' ')}` : ''}{f.opponentOrEvent ? ` · ${f.opponentOrEvent}` : ''}
                      </p>
                    </div>
                    <button onClick={() => toggleFeatured(f.id)} aria-label={f.featured ? 'Unfeature' : 'Feature'} className={cn('shrink-0 p-1 rounded-md hover:bg-muted', f.featured ? 'text-warning' : 'text-muted-foreground')}>
                      <Star size={17} fill={f.featured ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <DataSourceLabel source={f.source} />
                    <Badge variant={q >= 60 ? 'success' : q >= 45 ? 'default' : 'warning'}>Quality {q}</Badge>
                    {f.featured && <Badge variant="info">Featured</Badge>}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground" value={f.visibility} onChange={(e) => updateFilm(f.id, { visibility: e.target.value as Visibility })}>
                      <option value="private">Private</option><option value="link_only">On links</option><option value="public">Public</option>
                    </select>
                    <button onClick={() => removeFilm(f.id)} className="text-error/80 hover:text-error p-1 rounded-md hover:bg-error/10" aria-label="Remove film"><Trash2 size={15} /></button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
