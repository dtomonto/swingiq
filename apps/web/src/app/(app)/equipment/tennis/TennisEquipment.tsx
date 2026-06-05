'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingVantageStore, type TennisRacket } from '@/store';
import { scoreTennisRacket } from '@/lib/equipment/scoring';
import Link from 'next/link';
import { Plus, Trash2, ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';

const inp = 'w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';
const sel = `${inp} bg-card`;

const EMPTY: Omit<TennisRacket, 'id' | 'created_at'> = {
  brand: '', model: '', year: '', head_size_sq_in: null, weight_strung_oz: null,
  balance_pts_hl: null, swingweight: null, stiffness_ra: null, string_pattern: '',
  grip_size: '', string_brand: '', string_tension_mains: null,
  condition: 'good', notes: '',
};

export function TennisEquipment() {
  const { sportEquipment, addTennisRacket, removeTennisRacket } = useSwingVantageStore();
  const rackets = sportEquipment.tennis;

  const [form, setForm] = useState<Omit<TennisRacket, 'id' | 'created_at'>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function set(k: keyof typeof form, v: string | number | null) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function numOrNull(v: string) { const n = parseFloat(v); return isNaN(n) ? null : n; }

  function handleAdd() {
    if (!form.brand.trim() && !form.model.trim()) return;
    addTennisRacket(form);
    setForm(EMPTY);
    setShowForm(false);
  }

  return (
    <>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/equipment" className="text-sm text-warning hover:underline inline-flex items-center gap-1 mb-2">
            ← Equipment Center
          </Link>
          <h1 className="text-2xl font-bold text-foreground">🎾 Tennis Racket</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log your racket specs to add equipment context to your swing diagnosis.
          </p>
        </div>

        <div className="flex gap-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-4">
          <Info className="text-accent-secondary mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-foreground">
            <strong>Optional.</strong> Partial specs are fine — SwingVantage will note what data is missing and lower confidence accordingly. You can skip this entirely.
          </p>
        </div>

        {/* Existing rackets */}
        {rackets.map((racket) => {
          const score = scoreTennisRacket({
            headSizeSqIn: racket.head_size_sq_in,
            weightStrungOz: racket.weight_strung_oz,
            swingweight: racket.swingweight,
            stiffnessRa: racket.stiffness_ra,
            gripSize: racket.grip_size,
            skillLevel: 'intermediate',
            playStyle: 'baseline',
          });
          const expanded = expandedId === racket.id;
          return (
            <Card key={racket.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{racket.brand} {racket.model} {racket.year}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {racket.head_size_sq_in && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{racket.head_size_sq_in} sq in</span>}
                      {racket.weight_strung_oz && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{racket.weight_strung_oz} oz</span>}
                      {racket.grip_size && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Grip {racket.grip_size}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        score.fitRating === 'Excellent' ? 'bg-primary/15 text-primary' :
                        score.fitRating === 'Good' ? 'bg-accent-secondary/15 text-accent-secondary' :
                        score.fitRating === 'Fair' ? 'bg-warning/15 text-warning' :
                        score.fitRating === 'Mismatch' ? 'bg-error/15 text-error' :
                        'bg-muted text-muted-foreground'
                      }`}>{score.fitRating} • {score.overallScore}/100</span>
                    </div>
                  </div>
                  <button onClick={() => setExpandedId(expanded ? null : racket.id)} className="p-1 text-muted-foreground hover:text-muted-foreground">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {expanded && (
                  <div className="space-y-3 pt-2 border-t border-border text-sm">
                    <div>
                      <p className="font-medium text-foreground mb-1">Confidence: {Math.round(score.confidenceScore * 100)}%</p>
                      {score.evidence.map((e, i) => <p key={i} className="text-muted-foreground text-xs">• {e}</p>)}
                    </div>
                    {score.missingData.length > 0 && (
                      <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                        <p className="text-xs font-semibold text-warning mb-1">Missing data (would improve accuracy)</p>
                        {score.missingData.map((m, i) => <p key={i} className="text-xs text-warning">• {m}</p>)}
                      </div>
                    )}
                    {score.recommendations.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground mb-1">Recommendations</p>
                        {score.recommendations.map((r, i) => <p key={i} className="text-xs text-muted-foreground">• {r}</p>)}
                      </div>
                    )}
                    {score.adjustmentFirst && (
                      <div className="flex gap-2 text-xs bg-primary/10 border border-primary/30 rounded-lg p-2.5">
                        <Info size={13} className="text-primary shrink-0 mt-0.5" />
                        <span className="text-primary">Test adjustments (strings, tension, lead tape) before buying a new frame.</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground italic">{score.limitations[0]}</p>

                    {confirmDelete === racket.id ? (
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        <Button size="sm" className="bg-error text-error-foreground hover:bg-error/90" onClick={() => { removeTennisRacket(racket.id); setConfirmDelete(null); }}>
                          Delete
                        </Button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(racket.id)} className="flex items-center gap-1 text-xs text-error hover:text-error">
                        <Trash2 size={12} /> Remove this racket
                      </button>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}

        {/* Add form */}
        {!showForm ? (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Racket
          </Button>
        ) : (
          <Card>
            <CardHeader><CardTitle>Add Racket</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="tn-brand" className="text-xs font-medium text-muted-foreground block mb-1">Brand</label><input id="tn-brand" className={inp} placeholder="Wilson, Babolat…" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></div>
                <div><label htmlFor="tn-model" className="text-xs font-medium text-muted-foreground block mb-1">Model</label><input id="tn-model" className={inp} placeholder="Pro Staff, Pure Drive…" value={form.model} onChange={(e) => set('model', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="tn-year" className="text-xs font-medium text-muted-foreground block mb-1">Year <span className="text-muted-foreground">(optional)</span></label><input id="tn-year" className={inp} placeholder="2024" value={form.year} onChange={(e) => set('year', e.target.value)} /></div>
                <div><label htmlFor="tn-headsize" className="text-xs font-medium text-muted-foreground block mb-1">Head size (sq in)</label><input id="tn-headsize" type="number" className={inp} placeholder="98–110" value={form.head_size_sq_in ?? ''} onChange={(e) => set('head_size_sq_in', numOrNull(e.target.value))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="tn-strungweight" className="text-xs font-medium text-muted-foreground block mb-1">Strung weight (oz)</label><input id="tn-strungweight" type="number" className={inp} placeholder="10.5–11.5" step="0.1" value={form.weight_strung_oz ?? ''} onChange={(e) => set('weight_strung_oz', numOrNull(e.target.value))} /></div>
                <div><label htmlFor="tn-swingweight" className="text-xs font-medium text-muted-foreground block mb-1">Swingweight</label><input id="tn-swingweight" type="number" className={inp} placeholder="300–340" value={form.swingweight ?? ''} onChange={(e) => set('swingweight', numOrNull(e.target.value))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="tn-stiffness" className="text-xs font-medium text-muted-foreground block mb-1">Stiffness (RA)</label><input id="tn-stiffness" type="number" className={inp} placeholder="56–72" value={form.stiffness_ra ?? ''} onChange={(e) => set('stiffness_ra', numOrNull(e.target.value))} /></div>
                <div><label htmlFor="tn-gripsize" className="text-xs font-medium text-muted-foreground block mb-1">Grip size</label><input id="tn-gripsize" className={inp} placeholder="4 1/4, 4 3/8…" value={form.grip_size} onChange={(e) => set('grip_size', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="tn-stringbrand" className="text-xs font-medium text-muted-foreground block mb-1">String brand / type</label><input id="tn-stringbrand" className={inp} placeholder="Luxilon, Babolat RPM…" value={form.string_brand} onChange={(e) => set('string_brand', e.target.value)} /></div>
                <div><label htmlFor="tn-stringtension" className="text-xs font-medium text-muted-foreground block mb-1">String tension (mains, lbs)</label><input id="tn-stringtension" type="number" className={inp} placeholder="50–60" value={form.string_tension_mains ?? ''} onChange={(e) => set('string_tension_mains', numOrNull(e.target.value))} /></div>
              </div>
              <div><label htmlFor="tn-condition" className="text-xs font-medium text-muted-foreground block mb-1">Condition</label>
                <select id="tn-condition" className={sel} value={form.condition} onChange={(e) => set('condition', e.target.value as TennisRacket['condition'])}>
                  <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="worn">Worn</option>
                </select>
              </div>
              <div><label htmlFor="tn-notes" className="text-xs font-medium text-muted-foreground block mb-1">Notes <span className="text-muted-foreground">(optional)</span></label><textarea id="tn-notes" className={inp} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setForm(EMPTY); setShowForm(false); }}>Cancel</Button>
                <Button className="flex-1" onClick={handleAdd} disabled={!form.brand.trim() && !form.model.trim()}>Save Racket</Button>
              </div>
            </CardBody>
          </Card>
        )}

        {rackets.length === 0 && !showForm && (
          <div className="flex gap-2 text-sm text-muted-foreground bg-muted border border-border rounded-xl p-4">
            <AlertTriangle size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            No racket logged. Equipment context is optional — you can still use all SwingVantage features without it.
          </div>
        )}
      </div>
    </>
  );
}
