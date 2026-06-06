'use client';

// ============================================================
// Recruiting — HighlightReelBuilder
// ------------------------------------------------------------
// Compose reels from clips of uploaded film. Pick a sport-appropriate
// style, add clips (flash vs evaluation, full vs slow-mo), and get the
// engine's honest warnings: too long, flash-only, no game footage,
// low-context clips. One reel can be featured to open the profile.
// ============================================================

import { useMemo, useState } from 'react';
import type { SportId } from '@swingiq/core';
import { Clapperboard, Star, Plus, Trash2, CircleAlert, Info } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import {
  useRecruitingStore,
  reelStylesForSport,
  reelStyleLabel,
  analyzeReel,
} from '@/lib/recruiting';

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

function ReelCard({ reelId }: { reelId: string }) {
  const reel = useRecruitingStore((s) => s.reels.find((r) => r.id === reelId))!;
  const allClips = useRecruitingStore((s) => s.clips);
  const film = useRecruitingStore((s) => s.film.filter((f) => !f.deletedAt));
  const addClip = useRecruitingStore((s) => s.addClip);
  const removeClip = useRecruitingStore((s) => s.removeClip);
  const updateReel = useRecruitingStore((s) => s.updateReel);
  const setFeatured = useRecruitingStore((s) => s.setFeaturedReel);
  const removeReel = useRecruitingStore((s) => s.removeReel);

  const reelClips = reel.clipIds.map((id) => allClips.find((c) => c.id === id)).filter(Boolean);
  const analysis = useMemo(() => analyzeReel(reel, allClips, film), [reel, allClips, film]);

  const [filmId, setFilmId] = useState(film[0]?.id ?? '');
  const [label, setLabel] = useState('');
  const [start, setStart] = useState('0');
  const [end, setEnd] = useState('8');
  const [kindSel, setKindSel] = useState<'flash' | 'evaluation'>('flash');
  const [speed, setSpeed] = useState<'full' | 'slow'>('full');

  function add() {
    if (!filmId) return;
    const clipId = addClip({ filmId, label: label.trim() || 'Clip', startSeconds: Number(start), endSeconds: Number(end), kind: kindSel, speed });
    updateReel(reel.id, { clipIds: [...reel.clipIds, clipId] });
    setLabel('');
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clapperboard size={16} className="text-primary" /> {reel.title}
          <Badge variant="default">{reelStyleLabel(reel.style)}</Badge>
        </CardTitle>
        <div className="flex items-center gap-1">
          <button onClick={() => setFeatured(reel.id)} aria-label="Feature reel" className={cn('p-1 rounded-md hover:bg-muted', reel.featured ? 'text-warning' : 'text-muted-foreground')}>
            <Star size={16} fill={reel.featured ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => removeReel(reel.id)} aria-label="Delete reel" className="p-1 rounded-md text-error/80 hover:text-error hover:bg-error/10"><Trash2 size={15} /></button>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{analysis.clipCount} clips</span><span>·</span><span>{Math.round(analysis.totalSeconds)}s</span><span>·</span>
          <span>{analysis.flashCount} flash / {analysis.evaluationCount} eval</span>
          {reel.featured && <Badge variant="info">Featured reel</Badge>}
        </div>

        {analysis.findings.length > 0 && (
          <div className="space-y-1">
            {analysis.findings.map((f, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                {f.level === 'warn' ? <CircleAlert size={13} className="text-warning mt-0.5 shrink-0" /> : <Info size={13} className="text-accent-secondary mt-0.5 shrink-0" />}
                <span className="text-foreground/80">{f.message}</span>
              </div>
            ))}
          </div>
        )}

        {reelClips.length > 0 && (
          <ol className="space-y-1">
            {reelClips.map((c, i) => c && (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-sm">
                <span className="text-foreground/85 truncate">{i + 1}. {c.label} <span className="text-xs text-muted-foreground">({c.kind}, {c.speed}, {Math.max(0, c.endSeconds - c.startSeconds)}s)</span></span>
                <button onClick={() => removeClip(c.id)} className="text-error/70 hover:text-error" aria-label="Remove clip"><Trash2 size={13} /></button>
              </li>
            ))}
          </ol>
        )}

        {/* Clip selector */}
        {film.length === 0 ? (
          <p className="text-xs text-muted-foreground">Add film in the Film Library to build clips into this reel.</p>
        ) : (
          <div className="rounded-lg border border-border p-2.5 grid gap-2 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className="text-xs font-medium text-foreground">From film</span>
              <select className={inputCls} value={filmId} onChange={(e) => setFilmId(e.target.value)}>
                {film.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2"><span className="text-xs font-medium text-foreground">Clip label</span><input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Opposite-field double" /></label>
            <label className="block"><span className="text-xs font-medium text-foreground">Start (s)</span><input type="number" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} /></label>
            <label className="block"><span className="text-xs font-medium text-foreground">End (s)</span><input type="number" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
            <label className="block"><span className="text-xs font-medium text-foreground">Type</span>
              <select className={inputCls} value={kindSel} onChange={(e) => setKindSel(e.target.value as 'flash' | 'evaluation')}><option value="flash">Flash (wow)</option><option value="evaluation">Evaluation (mechanics)</option></select>
            </label>
            <label className="block"><span className="text-xs font-medium text-foreground">Speed</span>
              <select className={inputCls} value={speed} onChange={(e) => setSpeed(e.target.value as 'full' | 'slow')}><option value="full">Full speed</option><option value="slow">Slow-mo</option></select>
            </label>
            <div className="sm:col-span-2"><Button size="sm" onClick={add}><Plus size={14} /> Add clip</Button></div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function HighlightReelBuilder({ sport }: { sport: SportId }) {
  const reels = useRecruitingStore((s) => s.reels.filter((r) => r.sport === sport));
  const addReel = useRecruitingStore((s) => s.addReel);
  const styles = reelStylesForSport(sport);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState(styles[0]?.key ?? '');

  function create() {
    addReel({ title: title.trim() || reelStyleLabel(style), sport, style, featured: reels.length === 0 });
    setTitle(''); setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{reels.length} reel{reels.length === 1 ? '' : 's'}</h3>
        <Button size="sm" onClick={() => setOpen((o) => !o)}><Plus size={15} /> New reel</Button>
      </div>

      {open && (
        <Card>
          <CardBody className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-sm font-medium text-foreground">Reel style</span>
              <select className={inputCls} value={style} onChange={(e) => setStyle(e.target.value)}>
                {styles.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              {styles.find((s) => s.key === style) && <span className="block text-xs text-muted-foreground mt-1">{styles.find((s) => s.key === style)!.blurb}</span>}
            </label>
            <label className="block"><span className="text-sm font-medium text-foreground">Title</span><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={reelStyleLabel(style)} /></label>
            <div className="sm:col-span-2 flex gap-2"><Button onClick={create}>Create reel</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
          </CardBody>
        </Card>
      )}

      {reels.length === 0 ? (
        <Card><CardBody><EmptyState icon={Clapperboard} title="No reels yet" description="Build a ~90s primary reel: lead with a flash clip, then show repeatable mechanics. The builder warns you if it gets too long or lacks game footage." /></CardBody></Card>
      ) : (
        reels.map((r) => <ReelCard key={r.id} reelId={r.id} />)
      )}
    </div>
  );
}
